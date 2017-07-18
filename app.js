var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var request = require("request");
var orders = [];
var current_order = 0;

var options = {
    method: 'GET',
    url: 'http://legacy.cafebonappetit.com/api/2/menus',
    qs: {cafe: '245,246,247'},
    headers: {}
};
var cafes = {1: 246, 3: 245, 8: 247};
var cafe = {1: [], 3: [], 8: []};
var search_index = [];

app.get('/orders', function (req, res) {
    // res.sendFile(`/Users/i862025/whereToEat/index.html`);
    // let cafe_num = req.query.cafe;
    console.log(orders);
    res.render('index', { orders: orders })
})

request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var data = JSON.parse(body);
    var items = data.items;

    for (var building_nr in cafes) {
        var cafe_data = data.days[0].cafes[cafes[building_nr]].dayparts[0];
        // console.log(cafe_data);
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
                        // console.log(item);
                        cafe[building_nr][meal_type].push(item);
                    }
                }
            }
        }
    }
    // console.log(search_index);
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('/Users/i862025/whereToEat/views'));

app.set('views', './views')
app.set('view engine', 'pug')

app.listen(3000, function () {
});

var food_options = {"vg": 4, "v": 1, "ng": 9}

app.post('/cafe', function (req, res) {

    parts = req.body.text.split("-");
    cafe_options = parts[1];
    building_nr = parts[0].trim();
    // console.log(cafe_options);
    if (building_nr == 1 || building_nr == 3 || building_nr == 8) {
        // console.log(parts);
        var mes = {"attachments": []};
        for (var meal_type in cafe[building_nr]) {
            var att = undefined;
            for (var i in cafe[building_nr][meal_type]) {

                var meal = cafe[building_nr][meal_type][i];

                if (cafe_options !== undefined) {
                    if (food_options[cafe_options] in meal.cor_icon) {
                        var att = att || {
                                "color": ((meal_type == "Breakfast") ? "E4981E" : "1DC47C"),
                                "author_name": "Café " + building_nr,
                                "title": meal_type,
                                "title_link": "http://sap.cafebonappetit.com/cafe/cafe-" + building_nr + "/#panel-daypart-menu-" + ((meal_type == "Breakfast") ? "1" : "2"),
                                "fields": []
                            };
                        att.fields.push(renderField(meal));
                    }
                }
                else {
                    var att = att || {
                            "color": ((meal_type == "Breakfast") ? "E4981E" : "1DC47C"),
                            "author_name": "Café " + building_nr,
                            "title": meal_type,
                            "title_link": "http://sap.cafebonappetit.com/cafe/cafe-" + building_nr + "/#panel-daypart-menu-" + ((meal_type == "Breakfast") ? "1" : "2"),
                            "fields": []
                        };
                    att.fields.push(renderField(meal));
                }
            }
            if (att !== undefined) {

                mes.attachments.push(att);
            }
        }
    }
    else {
        var mes = {
            "response_type": "ephemeral",
            "text": "Sorry couldn't find your cafe! Please use `/cafe 1`, `/cafe 3` or `/cafe 8`."
        };
    }
    console.log(mes.attachments);
    if (mes.attachments.length == 0) {
        var mes = {
            "response_type": "ephemeral",
            "text": "Sorry, no meal matches your query parameter in this cafe, please try another one."
        };
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(mes));
});

app.post('/orderburger', function (req, res) {
    parts = req.body.text.split(" ");
    username = req.body.user_name;

    building_nr = parts[0];

    if (building_nr !== undefined && (building_nr == 1 || building_nr == 3 || building_nr == 8)) {
        if (parts[1] !== undefined) {
            note = parts.slice(1).join(" ");
            console.log(note);
            orders.push({
                "id": current_order + 1,
                "cafe": building_nr,
                "name": username,
                "note": note,
                "time": (+new Date()) / 1000

            });
            current_order++;

            var mes = {
                "attachments": [
                    {
                        "color": "good",
                        "author_name": "Café " + building_nr,
                        "title": "Order confirmed (Nr. " + current_order + ")",
                        "text": 'Your order (Nr. ' + current_order + ') for ' + username + ' of a burger with the note "' + note + '" has been confirmed and will be ready in about 10min.',
                        "ts": (+new Date()) / 1000
                    }
                ]
            }
        }
        else {
            var mes = {
                "response_type": "ephemeral",
                "text": "Please add a note for the chef to specify the ingredients and wishes you have for your burger For example `/orderburger 1 Please with cheddar cheese and bacon`."
            };
        }

    }
    else {
        var mes = {
            "response_type": "ephemeral",
            "text": "Please specifiy a valid cafe in which you are going (1, 3 or 8). For example `/orderburger 1 Please with cheese and bacon`."
        };
    }

    console.log(orders);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(mes));

});

app.post('/wheretoeat', function (req, res) {
    parts = req.body.text.split("-");
    cafe_options = parts[1];
    query = parts[0].trim();
    if (query.length >= 3) {
        var hit_cafes = {};
        for (var i in search_index) {
            var entry = search_index[i];
            if (entry.item.label.toLowerCase().includes(query.toLowerCase()) || entry.item.description.toLowerCase().includes(query.toLowerCase())) {
                if (cafe_options !== undefined) {
                    if (food_options[cafe_options] in entry.item.cor_icon) {
                        hit_cafes[entry.cafe] = hit_cafes[entry.cafe] || [];
                        hit_cafes[entry.cafe][entry.meal_type] = hit_cafes[entry.cafe][entry.meal_type] || [];
                        hit_cafes[entry.cafe][entry.meal_type].push(entry.item);

                    }


                }
                else {
                    hit_cafes[entry.cafe] = hit_cafes[entry.cafe] || [];
                    hit_cafes[entry.cafe][entry.meal_type] = hit_cafes[entry.cafe][entry.meal_type] || [];
                    hit_cafes[entry.cafe][entry.meal_type].push(entry.item);
                }
            }
        }
        // console.log(hit_cafes);
        if (Object.keys(hit_cafes).length !== 0) {
            var mes = {"attachments": []};
            for (var cafe in hit_cafes) {
                for (var meal_type in hit_cafes[cafe]) {
                    var att = {
                        "color": ((meal_type == "Breakfast") ? "E4981E" : "1DC47C"),
                        "author_name": "Café " + cafe,
                        "title": meal_type,
                        "title_link": "http://sap.cafebonappetit.com/cafe/cafe-" + cafe + "/#panel-daypart-menu-" + ((meal_type == "Breakfast") ? "1" : "2"),
                        "fields": []
                    };
                    for (var item_index in hit_cafes[cafe][meal_type]) {
                        var meal = hit_cafes[cafe][meal_type][item_index];
                        att.fields.push(renderField(meal));
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
    }
    else {
        var mes = {
            "response_type": "ephemeral",
            "text": "Please use at least 3 characters as search string."
        };
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(mes));
});


function renderField(meal) {
    var icon_string = "";
    if (4 in meal.cor_icon) {
        icon_string += ":vegan:";
    }
    if (1 in meal.cor_icon) {
        icon_string += ":vegetarian:";
    }
    if (9 in meal.cor_icon) {
        icon_string += ":nogluten:";
    }
    return {
        "title": meal.label + ((meal.price != "") ? " (" + meal.price + ")" : "") + icon_string,
        "value": meal.description.replace(/<br \/>/g, "\n"),
        "short": false
    };
}
