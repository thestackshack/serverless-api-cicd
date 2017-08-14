var assert = require('assert');
var winston = require('winston');
var _ = require('lodash');
var index = require('../index');

describe('index', function() {
    it('main', function (done) {
        index.handler({test:true}, {}, function(err, response) {
            assert.equal(response.statusCode, 200);
            assert.ok(response.body);
            var body = JSON.parse(response.body);
            assert.ok(body.event);
            assert.ok(body.event.test);
            winston.info(JSON.stringify(response, null, 3));
            done();
        });
    });
});