//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-mai:Mai_123456@cluster0-wqtye.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

//const items = ["Buy Food", "Cook Food", "Eat Food"];
//const workItems = [];
//create items schema
const itemsSchema = {
  name: String
};

//create mongoose model as per the above schema
const Item = mongoose.model("Item", itemsSchema);
//create document using mongoose
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3]

//create new schema
const listScema = {
  name: String,
  items: [itemsSchema]
};
//create list model from list schema
const List = mongoose.model("List", listScema)

app.get("/", function(req, res) {
  //call mongoose method
  Item.find({}, function(err, foundItems) {
    //check if item collection is empty...?
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved all item into database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
  //const day = date.getDate();
  //res.render("list", {listTitle: day, newListItems: items});
});

//use Post when there is a form submission
//GET is mostly used for view purpose (e.g. SQL SELECT) while POST is mainly use for update purpose (e.g. SQL INSERT or UPDATE).
app.post("/", function(req, res) {
  //bodyParser package gets new item from the form
  const itemName = req.body.newItem; //name of input item is "newItem"
  const listName = req.body.list; //name of + button is "list"
  //create new item document for that database
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  //req.body.NameAttribute (on the form input)
  //console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") { //on the default list
    //then, perform regular find and remove like earlier
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        //after deleted then redirect to the home route to find all items in existed item collection
        res.redirect("/");
      }
    });
  } else { //where the listName is NOT today
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        //redirect to that list path
        res.redirect("/"+ listName);
      }
    });
  }

  console.log(req.body.checkbox);
});



app.get("/:customListName", function(req, res) {
  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //console.log("Doesn't exist!")
        //Not found, so Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
      } else {
        //console.log("Exist!")
        //Found, so Show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
