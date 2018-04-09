// Dependencies
const rp = require('request-promise');
const Table = require('cli-table');

// Replace with your access token and instance URL
const access_token = 'YOUR_ACCESS_TOKEN';
const instance = `http://docs-test.datafusion.thomsonreuters.com`;

// Replace with your three tokens
const token_a = {tokenPart: "9202c1f144d3b2eafb20d216b0217c8f", count: 99};
const token_b = {tokenPart: "7b812fb574d21064993c89a63c838769", count: 97};
const token_c = {tokenPart: "5a896d7b8dbc8bc3b1a9b25a05bff36b", count: 94};

// Static set of options for creating POST requests with Data Fusion
let options = {
    method: 'POST',
    headers: {
        'Authorization': "Bearer " + access_token,
        'User-Agent': 'Request-Promise',
        'Content-Type': 'text/plain'
    },
    json: true
};

// This object sets up the table we'll be using to visualize results at the end
let tableData = {
    a: ['Species: "A"', 'x', 'x', 'x', '', 'x', '', ''],
    b: ['Species: "B"', 'x', 'x', '', 'x', '', 'x', ''],
    c: ['Species: "C"', 'x', '', 'x', 'x', '', '', 'x']
}

// DF Intersection POST Call
// Determines how many tokenized sets to find the intersection on, then makes the
// appropriate API call. The number of intersections is returned. 
let getInt = function(a, b, c){
    options.uri = `${instance}/datafusion/api/entities/intersection?token=${a}&token=${b}`;
    if (c != undefined) options.uri += `&token=${c}`;

    return rp(options)
    .then(function (response) {
        return response.count
    })
    .catch(function (err) {
        console.log(err.message);
        return null;
    });
}

// DF Union POST Call
// Accepts two token sets as inputs. Combines the sets and returns a new token.
let getUnion = function(a,b){
    options.uri = `${instance}/datafusion/api/entities/union?token=${a}&token=${b}`

    return rp(options)
    .then(function (response) {
        return response;
    })
    .catch(function (err) {
        console.log(err.message);
        return null;
    });
}

// This function combines multiple sets and creates three new sets: ab, ac, bc
// These sets are later used to determine entities unique to single sets.
async function getUnions(a, b, c) {
    const ab = await getUnion(a.tokenPart, b.tokenPart);
    const ac = await getUnion(a.tokenPart, c.tokenPart);
    const bc = await getUnion(b.tokenPart, c.tokenPart);
    return {ab, ac, bc};
}

// This is the meat of the application. This function determines all
// intersections for all seven possibilities and saves the results
async function getInts(a, b, c, ab, ac, bc) {
    const all_num = await getInt(a.tokenPart, b.tokenPart, c.tokenPart);
    const bc_num = await getInt(b.tokenPart, c.tokenPart);
    const ac_num = await getInt(a.tokenPart, c.tokenPart);
    const ab_num = await getInt(a.tokenPart, b.tokenPart);

    const a_num = a.count - await getInt(a.tokenPart, bc.tokenPart);
    const b_num = b.count - await getInt(b.tokenPart, ac.tokenPart);
    const c_num = c.count - await getInt(c.tokenPart, ab.tokenPart);
    return [all_num, ab_num, ac_num, bc_num, a_num, b_num, c_num];
}
 
// This function initiates all other functions and then builds the table
async function buildTable(){
    console.log("Creating Unions...")
    const {ab, ac, bc} = await getUnions(token_a, token_b, token_c);
    console.log("Finding Intersections...")
    const data = await getInts(token_a, token_b, token_c, ab, ac, bc);

    tableData.d = data;
    tableData.d.unshift('Genes in Common:');

    let table = new Table();
    table.push(tableData.a, tableData.b, tableData.c, tableData.d)
    console.log(table.toString());
}

buildTable();