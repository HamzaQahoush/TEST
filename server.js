'use strict';

const express = require('express');
const server = express();
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const methodOverRide = require('method-override');
// POSTGRESS
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

//server use & set
server.use(cors());
server.use(express.static('./public'));
server.use(express.urlencoded({ extended: true }));
server.use(methodOverRide('_method'));
server.set('view engine', 'ejs');

//port
const PORT = process.env.PORT || 3000;

// routes:
server.get('/', homepage);
server.get('/searchResult', searchResult);
server.get('/allCountries', allCountries);
server.post('/records', addToRecord);
server.get('/records', allAddrecords);
server.get('/details/:id', viewdetail);
server.delete('/delete/:id', deleteData);

//functions
function homepage(req, res) {
  let url = `https://api.covid19api.com/world/total`;
  superagent.get(url).then(data => {
    let mydata = data.body;

    res.render('pages/index', { worldData: mydata });
  });
}

function searchResult(req, res) {
  let { country, from, to } = req.query;
  // let country = req.query.country;
  // let from = req.query.from;
  // let to = req.query.to;
  let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
  superagent.get(url).then(data => {
    console.log(data.body);
    let reqdata = data.body.map(item => {
      return new Country(item);
    });
    res.render('pages/searchResult', { dataSearch: reqdata });
  });
}

function allCountries(req, res) {
  let url = `https://api.covid19api.com/summary`;
  superagent.get(url).then(data => {
    let dataCountry = data.body.Countries.map(country => {
      return new AllCountries(country);
    });
    res.render('pages/allCountries', { allCountriesData: dataCountry });
  });
}

function addToRecord(req, res) {
  let { country, confirmedCases, totalDeaths, totalRecovered, date } = req.body;
  let sql = `INSERT INTO covid (country,confirmedCases,totalDeaths,totalRecovered,date) VALUES($1,$2,$3,$4,$5) RETURNING *;`;
  let saveVal = [country, confirmedCases, totalDeaths, totalRecovered, date];
  client.query(sql, saveVal).then(() => {
    res.redirect('/records');
  });
}

function allAddrecords(req, res) {
  let sql = `SELECT * FROM covid;`;
  client.query(sql).then(data => {
    res.render('pages/records', { selectedData: data.rows });
  });
}

function viewdetail(req, res) {
  let sql = `SELECT FROM covid WHERE id=$1;`;
  let value = [req.params.id];
  client.query(sql, value).then(data => {
    console.log(data.rows[0]);
    res.render('pages/details', { dataSelected: data.rows[0] });
  });
}

function deleteData(req, res) {
  let sql = `DELETE FROM covid WHERE id=$1;`;
  let value = [req.params.id];
  client.query(sql, value).then(() => {
    res.redirect('/records');
  });
}
function AllCountries(data) {
  this.country = data.Country;
  this.totalConfirmed = data.TotalConfirmed;
  this.totalDeaths = data.TotalDeaths;
  this.totalRecovered = data.TotalRecovered;
  this.date = data.Date.slice(0, 10);
}

function Country(reqData) {
  this.date = reqData.Date.slice(0, 10);
  this.cases = reqData.Cases;
  this.country = reqData.Country;
}

client.connect().then(() => {
  server.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
  });
});
