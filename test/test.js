var assert = require('assert');
var winston = require('winston');
var _ = require('lodash');
var index = require('../index');

describe('index', function() {
    it('main', function (done) {
        index.handler({}, {}, function(err, response) {
            assert.equal(response.statusCode, 200);
            done();
        });
    });
});