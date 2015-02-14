var module = angular.module("logApp.Services",[]);
module.factory('logsService',['$resource',function($resource) {
	var hostUrl = "http://localhost:2002/";
	var api = "api/log";
        return $resource(hostUrl + api,{}, {
            get: {
                method: 'GET',
                isArray: true
            }
        });
	}]);
  