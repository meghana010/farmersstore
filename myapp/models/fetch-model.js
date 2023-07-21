var mongoose=require('mongoose');
var db = require('../database');
var fs=require('fs');
const { query } = require('express');
const {regTable}=require('./user');

module.exports={
     
    fetchData:function(callback){
       var regData=regTable.find().sort({_id: -1 }).limit(1);
       regData.exec(function(err, data){
        if(err) throw err;
        return callback(data);
    }); 
    }
}