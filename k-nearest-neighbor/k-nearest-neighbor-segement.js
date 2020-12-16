// Packets used by node.js to read XLS files
var xls = require('node-xlrd');

// Sample represents a sample
var Sample = function (object) {
    // Clone attributes from the passed object to the newly created sample
    for (var key in object)
    {
        // Verify whether attributes belong to the object itself
        if (object.hasOwnProperty(key)) {
            this[key] = object[key];
        }
    }
}

// The Euclidean distance is used to calculate the distance between samples.
Sample.prototype.measureDistances = function(a, b, c, d, e, f, g, h, i, j, k) { 
    for (var i in this.neighbors)
    {
        var neighbor = this.neighbors[i];
        var a = neighbor.a - this.a;
        var b = neighbor.b - this.b;
        var c = neighbor.c - this.c;
        var d = neighbor.d - this.d;
        var e = neighbor.e - this.e;
        var f = neighbor.f - this.f;
        var g = neighbor.g - this.g;
        var h = neighbor.h - this.h;
        var i = neighbor.i - this.i;
        var j = neighbor.j - this.j;
        var k = neighbor.k - this.k;
       
        // Calculating Euclidean Distance
        neighbor.distance = Math.sqrt(a*a + b*b + c*c + d*d + e*e + f*f + g*g + h*h + i*i + j*j + k*k);
    }
};

// Sort neighbor samples according to the distance between the predicted samples and the predicted samples
Sample.prototype.sortByDistance = function() {
    this.neighbors.sort(function (a, b) {
        return a.distance - b.distance;
    });
};

// Judging the Category of Predicted Samples
Sample.prototype.guessType = function(k) {
    // There are two categories 1 and - 1
    var types = { '1': 0, '-1': 0 };
    // intercept the first k of neighbors according to K value
    for (var i in this.neighbors.slice(0, k))
    {
        var neighbor = this.neighbors[i];
        types[neighbor.trueType] += 1;
    }
    
    // Judging which sample type is more in the neighborhood
    if(types['1']>types['-1']){
        this.type = '1';
    } else {
        this.type = '-1';
    }
    
};


// SampleSet manages all sample parameters k to represent K in KNN
var SampleSet = function(k) { 
    this.samples = [];
    this.k = k;
};

// Add samples to the sample array
SampleSet.prototype.add = function(sample) {
    this.samples.push(sample);
}


// Construct an array of total samples with unknown types of samples
SampleSet.prototype.determineUnknown = function() {
    /*
     * Once an unknown type of sample is found, all known samples are taken. 
     * Cloned as the neighbor sequence of the unknown sample.
     * The reason for this is that we need to calculate the distance between the unknown sample and all known samples.
     */
    for (var i in this.samples)
    {
        // If no type of sample is found
        if ( ! this.samples[i].type)
        {
            // Initialize Neighbors of Unknown Samples
            this.samples[i].neighbors = [];
            
            // Generating Neighbor Sets
            for (var j in this.samples)
            {
                // If an unknown sample is encountered, skip
                if ( ! this.samples[j].type)
                    continue;
                this.samples[i].neighbors.push( new Sample(this.samples[j]) );
            }
            
            // Calculating the Distance between All Neighbors and Predicted Samples
            this.samples[i].measureDistances(this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h, this.k);

            // Sort all neighbors by distance
            this.samples[i].sortByDistance();

            // guess the type of forecasting sample
            this.samples[i].guessType(this.k);
        }
    }
};

var data = [];
// Mapping the data in the file to the attributes of the sample
var map = ['a','b','c','d','e','f','g','h','i','j','k'];
// Read files
xls.open('data.xls', function(err,bk){
    if(err) {console.log(err.name, err.message); return;}
    var shtCount = bk.sheet.count;
    for(var sIdx = 0; sIdx < shtCount; sIdx++ ){
        var sht = bk.sheets[sIdx],
            rCount = sht.row.count,
            cCount = sht.column.count;
        for(var rIdx = 0; rIdx < rCount; rIdx++){
            var item = {};
            for(var cIdx = 0; cIdx < cCount; cIdx++){
                item[map[cIdx]] = sht.cell(rIdx,cIdx);
            }
            data.push(item);
        }
    }
    // Execute the test after reading the file.
    run();
});

function run() {
    // 提供的数据的Type放在一个独立的文件中 前43个全是“1” 这里手动添加
    for(var i = 0;i < 96;i++){
            if(i < 43){
                data[i].type = "1";
                data[i].trueType = "1";
            } else {
                data[i].type = "-1";
                data[i].trueType = "-1";
            }
    }

    // k设为4时精度还可以
    var sampleSet1 = new SampleSet(4);
    for(var m in data){
        sampleSet1.add(new Sample(data[m]));
    }

    // 留一法交叉验证开始
    var count = 0;
    for(var i = 0;i < 96;i++){
        sampleSet1.samples[i].type = undefined;
        sampleSet1.determineUnknown();
        if(sampleSet1.samples[i].type === sampleSet1.samples[i].trueType) {
            count++;
        }
    }
    console.log("Le nombre de paires pour la validation croisée avec un retrait " + count);// k为4时输出55
    var percent = count/96;
    console.log("Précision de la classification de validation croisée sans réponse: " + percent);// 分类精度为0.572916666666..


    // 下面做十倍交叉验证！
    // 重建一个样本集合
    var SampleSet2 = new SampleSet(9);
    var totalPercent = 0;
    for(var q in data){
        SampleSet2.add(new Sample(data[q]));
    }

    // helper函数 将数组里的元素随机摆放
    function ruffle(array) {
        array.sort(function (a, b) {
            return Math.random() - 0.5;
        })
    }

    // 将整个样本集随机打乱
    // 总共有96个样本 分为9组10个的，一组6个
    ruffle(SampleSet2.samples);
    count = 0;
    for (i = 0;i < 6;i++) {
      SampleSet2.samples[i].type = undefined;
     
    }
    SampleSet2.determineUnknown();
    for (i = 0;i < 6;i++) {
        if(SampleSet2.samples[i].type === SampleSet2.samples[i].trueType){
            count++;
        }
    }
    totalPercent = count/6;


    // 还有9次测试
    var pointer = 6;
    for (i = 0;i < 9;i++){
        count = 0;
        
        for(var index = pointer;index < pointer + 10 ;index++) {
             SampleSet2.samples[index].type = undefined;
             //console.log(index);
        }
        
        SampleSet2.determineUnknown();

        for(index = pointer;index < pointer + 10 ;index++) {
            if(SampleSet2.samples[index].type === SampleSet2.samples[index].trueType){
                count++;
            }
        }
        pointer += 10;
        totalPercent += count/10;
    }
    
    // 因为每次都把数据随机打乱一下 所以每次精度都不同
    console.log("Précision de classification par validation croisée 10 fois:"+totalPercent/10);
}















