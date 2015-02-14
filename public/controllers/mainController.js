var module = angular.module('myApp.controllers',[]);

module.controller('mainController',["$scope","logsService",function($scope,logsService)
{
	//init
    var init = function()
    {
		$scope.logEntries = [];
		$scope.swarms = [];
		//represents a selection of all
		$scope.swarmModel = '*';
		$scope.swarms.push($scope.swarmModel);

	    $scope.selectedFile = false;
	    $scope.loading = false;
		$scope.intervals = [{name:"5 Seconds", value:5000},{name:"10 Seconds", value:10000},{name:"20 Seconds", value:20000},{name:"30 Seconds", value:30000}];
		$scope.interval = $scope.intervals[0];

		$scope.chartObject = 
			{
				"type": "AreaChart",
			  	"displayed": true,
			  	"data": {
			    "cols": [
			      {
			        "type": "string",
			        "p": {}
			      },
			      {
			        "type": "number",
			        "p": {}
			      }
			    ],
			    "rows": []
			  	},
			  	"options": {
			    "title": "PPT (peers per time)",
			    "isStacked": "true",
			    "fill": 20,
			    "displayExactValues": true,
			    "vAxis": {
			      "title": "Peers",
			      "gridlines": {
			        "count": 10
			      }
			    },
			    "hAxis": {
			      "title": "Time (hover for specifeid date)"
			    }
			  	},
			  	"formatters": {}
			}

    };
    init();
	
	$scope.fileNameChanged = function() {
  		$scope.selectedFile = true;
  		if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
		    $scope.$apply();
		}
	}

	//parse entries - a text block of predefined data into json
	$scope.parseEntries = function(entries)
	{
		var logEntries = [];
		var swarms = [];
		var timeLength = 20;

		while(end != -1)
		{
			//find {} blocks along with current line's date
			var time = new Date(entries.substring(0,timeLength));
			var start = entries.indexOf('{');
			var end = entries.indexOf('}');
			
			if(start > -1 && end > -1)
			{
				var line = entries.slice(start,end+1);
				var entry = JSON.parse(line);
				//find element with a leave\join property
				if(entry.leave || entry.join)
				{
					//maintain an array that holds a single intance of each peer id 
					var newEntry = true;
					for (var i = 0; i < logEntries.length; i++) 
					{
						if(logEntries[i].peerId == entry.peerId)
						{
							if(entry.leave)
							{
								logEntries[i].leave = time;
							}
							else
							{
								logEntries[i].join = time;
							}

							newEntry = false;	
						}
					}
					if(newEntry)
					{
						if(entry.leave)
						{
							entry.leave = time;
						}
						else
						{
							entry.join = time;
						}	
						logEntries.push(entry);
					}	

					//maintain an array of single instance dwarms
					var newSwarmEntry = true;
					for (var i = 0; i < swarms.length; i++) 
					{
						if(swarms[i] == entry.swarmId)
						{
							newSwarmEntry = false;
						}
					}
					if(newSwarmEntry)
					{
						swarms.push(entry.swarmId);
					}
				}

				//slice the curent line
				entries = entries.substr(end+2, entries.length);
				
				//jump to the next line
				start = end + 2;
			}
		}

		//add the array of log entries \ swarms to the current array
		$scope.logEntries = $scope.logEntries.concat(logEntries);
		$scope.swarms = $scope.swarms.concat(swarms);
		//represents all swarms in the UI
		$scope.swarmModel = '*';
		if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
		    $scope.$apply();
		}
		$scope.loading = false;
		$scope.createTableData();
	};
	

	//extracts min & max values from log entries and sets the x axis considering the chosen interval
	$scope.getTableXaxis = function()
	{
		var minTime,maxTime;
		var i = 0;
		var length = $scope.logEntries.length -1;

		//find min
		while(i <= length)
		{
			if($scope.logEntries[i].join)
			{
				if(!minTime)
					minTime = $scope.logEntries[i].join;
				else if($scope.logEntries[i].join < minTime)
						minTime = $scope.logEntries[i].join; 
			}
			if($scope.logEntries[i].leave)
			{
				if(!minTime)
					minTime = $scope.logEntries[i].leave;
				else if($scope.logEntries[i].leave < minTime)
						minTime = $scope.logEntries[i].leave; 
				
			}
			i++;
		}

		i = 0;
		//find max
		while(i <= length)
		{
			if($scope.logEntries[i].join)
			{
				if(!maxTime)
					maxTime = $scope.logEntries[i].join;
				else if($scope.logEntries[i].join > maxTime)
					maxTime = $scope.logEntries[i].join; 
			}
			if($scope.logEntries[i].leave)
			{
				if(!maxTime)
					maxTime = $scope.logEntries[i].leave;
				else if($scope.logEntries[i].leave > maxTime)
					maxTime = $scope.logEntries[i].leave; 
			}
			i++;
		}
		
		//create time slices between min and max:  min| | | |-- interval -- | |max
		var xAxis = [];

		//takes time and adds interval 
		var getNext = function(time)
		{
			var time = new Date(time.getTime());
			time.setSeconds(time.getSeconds() + $scope.interval.value/1000);
			return time;
		}
		for(var i = minTime; i<=maxTime; i= getNext(i))
		{
			xAxis.push({date:i});
		}
		return xAxis;
	}
	
	//create table using current log entries json(s).
	//consider the selected swarnId
	$scope.createTableData = function(swarm)
	{
		//search for hits for the given table x axis:   | | | > join leav <| |
		var xAxis = $scope.getTableXaxis();
		for (var i = 0; i < xAxis.length; i++) 
		{
			xAxis[i].hits = 0;
			for (var j = 0; j < $scope.logEntries.length; j++) 
			{
				if(!$scope.logEntries[j].leave)
				 	$scope.logEntries[j].leave = xAxis[length].date;
				if(!$scope.logEntries[j].join) 
					$scope.logEntries[j].join = xAxis[0].date;
				
				if($scope.logEntries[j].join <= xAxis[i].date && $scope.logEntries[j].leave >= xAxis[i].date)
				{
					//no specifeid swarm
					if(!swarm || swarm == '*')
					{
						xAxis[i].hits++;
					}
					else
					{	//relate only to a given swarm
						if(swarm == $scope.logEntries[j].swarmId)
					 		xAxis[i].hits++;
					 	//else ignore 
					}
				}
			};
		};
	
		var rows = [];
		for (var i = 0; i < xAxis.length; i++) 
		{
			var row = 
			{
		        "c": [
		          {
		            "v": xAxis[i].date
		          },
		          {
		            "v": xAxis[i].hits,
		            "f": ""
		          }
		        ]
		    };
		    rows.push(row);
		}

		$scope.chartObject.data.rows = rows;

		if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
		    $scope.$apply();
		}

	};

	//extract the text from the selected file
	$scope.addFile = function()
	{
		$scope.loading = true;
		var f = document.getElementById('file').files[0],
	    r = new FileReader();
		r.onloadend = function(e)
		{
			var entries = e.target.result;
			$scope.parseEntries(entries);
		}
		r.readAsBinaryString(f);
	}

	//retrive static log files for the server
	$scope.getLogFromServer = function()
	{
		$scope.loading = true;

		var logs = logsService.get(function(data)
			{
				for (var i = 0; i < data.length; i++) {
					$scope.parseEntries(data[i]);
					$scope.loading = false;
				};
				$scope.loading = false;
			},function(err){console.log(err);  $scope.loading = false;});
	}
	
}]);