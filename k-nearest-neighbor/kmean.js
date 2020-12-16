const xlsxFile = require('read-excel-file/node');
const fs = require('fs');
 
xlsxFile('testXlsx.xlsx').then((rows) => {
    //console.log(rows);
    //console.table(rows);

    console.log(rows.length)

    // Create the data 2D-array (vectors) describing the data
  let vectors = new Array();
  for (let i = 0 ; i < rows.length ; i++) {
    vectors[i] = [ rows[i][0] , rows[i][1]];
  }
   
  const kmeans = require('node-kmeans');
  kmeans.clusterize(vectors, {k: 2000}, (err,res) => {
    if (err) console.error(err);
    else console.log('%o',res);

    
    fs.writeFile("res.json", JSON.stringify(res), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    }); 
  });

  

})


