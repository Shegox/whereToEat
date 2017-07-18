var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var request = require("request");

var options = {
    method: 'GET',
    url: 'http://legacy.cafebonappetit.com/api/2/menus',
    qs: {cafe: '245,246,247'},
    headers: {}
};
var cafes = {1: 246, 3: 245, 8: 247};
var cafe = {1: [], 3: [], 8: []};
var search_index = [];

request(options, function (error, response, body) {
    if (error) throw new Error(error);
    //  console.log(body);
    var data = JSON.parse(body);
    var items = data.items;
    //      console.log(data.days[0].date);

    for (var building_nr in cafes) {
        var cafe_data = data.days[0].cafes[cafes[building_nr]].dayparts[0];
        console.log(cafe_data);
        for (var daypart in cafe_data) {
            var meal_type = cafe_data[daypart].label;
            cafe[building_nr][meal_type] = [];


            for (var i in cafe_data[daypart]["stations"]) {
                var station = cafe_data[daypart]["stations"][i];
                for (var j in station["items"]) {
                    var item = station["items"][j];
                    var item = items[item];
                    search_index.push({"item": item, "cafe": building_nr, "meal_type": meal_type});

                    if (item.tier == 1) {
                        console.log(item);
                        cafe[building_nr][meal_type].push(item);
                    }
                }
            }
        }
    }

    console.log(search_index);

});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello Wor ld!')
});

app.listen(3000, function () {
});

app.post('/cafe', function (req, res) {
    if (req.body.text == 1 || req.body.text == 3 || req.body.text == 8) {

        var mes = {"attachments": []};
        for (var meal_type in cafe[req.body.text]) {
            var att = {
                "color": "",
                "author_name": "Cafe " + req.body.text,
                "title": meal_type,
                "title_link": "http://sap.cafebonappetit.com/cafe/cafe-" + req.body.text + "/#panel-daypart-menu-" + ((meal_type == "Breakfast") ? "1" : "2"),
                "fields": []
            };

            for (var i in cafe[req.body.text][meal_type]) {
                var meal = cafe[req.body.text][meal_type][i];
                att.fields.push({
                    "title": meal.label,
                    "value": meal.description.replace(/<br \/>/g, "\n"),
                    "short": false
                });
            }
            mes.attachments.push(att);
        }

        res.setHeader('Content-Type', 'application/json');

        res.send(JSON.stringify(mes));
    }
    else {
        var mes = {
            "response_type": "ephemeral",
            "text": "Sorry couldn't find your cafe! Please use `/cafe 1`, `/cafe 3` or `/cafe 8`"
        };
    }
    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify(mes));
    //  console.log(req.body.text);
});

app.post('/wheretoeat', function (req, res) {
    var hit_cafes = {};
    for (var i in search_index) {
        var entry = search_index[i];
        if (entry.item.label.toLowerCase().includes(req.body.text.toLowerCase()) || entry.item.description.toLowerCase().includes(req.body.text.toLowerCase())) {
            hit_cafes[entry.cafe] = hit_cafes[entry.cafe] || [];
            hit_cafes[entry.cafe][entry.meal_type] = hit_cafes[entry.cafe][entry.meal_type] || [];
            hit_cafes[entry.cafe][entry.meal_type].push(entry.item);
        }
    }
    console.log(hit_cafes);
    if (Object.keys(hit_cafes).length !== 0) {
        var mes = {"attachments": []};
        for (var cafe in hit_cafes) {
            for (var meal_type in hit_cafes[cafe]) {
                var att = {
                    "color": "",
                    "author_name": "Cafe " + cafe,
                    "title": meal_type,
                    "title_link": "http://sap.cafebonappetit.com/cafe/cafe-" + cafe + "/#panel-daypart-menu-" + ((meal_type == "Breakfast") ? "1" : "2"),
                    "fields": []
                };
                for (var item_index in hit_cafes[cafe][meal_type]) {
                    var meal = hit_cafes[cafe][meal_type][item_index];
                    att.fields.push({
                        "title": meal.label,
                        "value": meal.description.replace(/<br \/>/g, "\n"),
                        "short": false
                    });

                }
                mes.attachments.push(att);
            }
        }


    }
    else {
        var mes = {
            "response_type": "ephemeral",
            "text": "Sorry, but it seems that " + req.body.text + " is not served today."
        };
    }

    res.setHeader('Content-Type', 'application/json');

    res.send(JSON.stringify(mes));
});



