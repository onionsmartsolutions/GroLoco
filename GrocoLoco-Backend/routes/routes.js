
// require('../db/BlockCoordinates');   
// require('../db/ItemCoordinates');   
var passport = require('passport');
var clone = require('clone');
var raccoon = require('raccoon');
var testSet = require('../machinelearningdata/testSet.js')

//RACCOON ==========================================================
// raccoon.config.nearestNeighbors = 5;  
// raccoon.config.className = 'groceryitem';  // prefix for your items (used for redis) 
// raccoon.config.numOfRecsStore = 30;  // number of recommendations to store per user 
// raccoon.config.factorLeastSimilarLeastLiked = false; 

// raccoon.connect('6379', '127.0.0.1') // auth is optional, but required for remote redis instances 
// // remember to call them as environment variables with process.env.name_of_variable 
// raccoon.flush() // flushes your redis instance 

//ROUTES ===========================================================

module.exports = function (app){
    app.get('/testSet', isAuthenticated, function(req,res){
        for (var i = 0; i < testSet.length; i++) {
            console.log(testSet[i]._id.$oid)
        }
        res.send(testSet)
    })

    app.post('/likeitem', isAuthenticated, function(req, res){
        //Mark ID
            console.log('hey')

        raccoon.liked('560c18022955001100873ddc', testSet[0]._id.$oid, function() {
            console.log();
        })
        // raccoon.flush();
        raccoon.liked('560c18022955001100873ddc', testSet[2]._id.$oid, function() {
            console.log();
        })
        raccoon.liked('560c18022955001100873ddc', testSet[3]._id.$oid, function() {
            console.log();
        })

<<<<<<< HEAD
    app.get('/getIcon', function(req,res){

        Icon.findOne({
            'UPC': req.query.UPC
        }, function(err, item){
            if(err)
                res.send(err);
            if(item) {
              
            } else{
                res.send(404)
            }
        })
    });
=======
        console.log(req.user._id)

        //morgan
        raccoon.liked('560a0c80fb729eab18ab31fb', testSet[0]._id.$oid,function() {
            console.log();
        })
        res.send(200)
    })

    app.get('/getreccomendations', isAuthenticated, function(req, res){
        raccoon.recommendFor('560a0c80fb729eab18ab31fb', 5, function(results){
            raccoon.flush()
            res.send(results)
        })
    })
>>>>>>> 97681e6ad22f80933a70516857d0e68d4598db0b

    app.get('/finditems/:subsearch', isAuthenticated, function(req, res){
        var itemList = []
        var subSearch = req.params.subsearch

        var time_1 = Date.now()
        var time_2 = 0
        var total_time = 0

        var redisQuery = 'autocomplete/' + subSearch
        console.log(redisQuery)

        client.get(redisQuery, function(err, data){
            if(err)
                res.send(err)
            if(data){
                time_2 = Date.now()
                total_time = time_2-time_1
                console.log('Time to retrieve using Redis: ' + total_time+'ms')
                res.send(JSON.parse(data))
            }else{
                GroceryItem.find({}, function(err, groceryitems){
                    if(err)
                        res.send(err)
                    if(groceryitems){
                        for(var i = 0; i < groceryitems.length; i++){
                            if(groceryitems[i].Description){
                                for (var j = 0; j < groceryitems[i].Description.length - subSearch.length + 1 ; j++) {                            
                                    if(groceryitems[i].Description.substring(j, j + subSearch.length).toLowerCase() == subSearch.toLowerCase()){
                                        itemList.push(groceryitems[i])
                                    }
                                }
                            }
                        }
                        time_2 = Date.now()
                        total_time = time_2-time_1
                        console.log('Time to retrieve using MongoDB: ' + total_time+'ms')
                        client.set(redisQuery, JSON.stringify(itemList))
                        res.send(itemList)
                    }
                    else
                        res.send(404)
               })
            }
        })


    });  

    // //Auto lookup
    // app.get('/finditems/:subsearch', isAuthenticated, function(req, res){
    //     var itemList = []
    //     var subSearch = req.params.subsearch

    //     GroceryItem.find({}, function(err, groceryitems){
    //         if(err)
    //             res.send(err)
    //         if(groceryitems){
    //             for(var i = 0; i < groceryitems.length; i++){
    //                 if(groceryitems[i].Description){
    //                     for (var j = 0; j < groceryitems[i].Description.length - subSearch.length + 1 ; j++) {                            
    //                         if(groceryitems[i].Description.substring(j, j + subSearch.length).toLowerCase() == subSearch.toLowerCase()){
    //                             itemList.push(groceryitems[i])
    //                         }
    //                     }
    //                 }
    //             }
    //             res.send(itemList)
    //         }
    //         else
    //             res.send(404)
    //    })
    // });  

    // parameters: UPCode
    app.get('/itemcoordinates', function(req, res){ // app.get('/itemcoordinates', isAuthenticated, function(req, res){      
        GroceryItem.findOne({
            'UPC': req.query.UPC
        }, function(err, item){
            if(err)
                res.send(err);
            if(item) {
                // found item, now need to get and set its coordinates
                console.log('about to find coordinates');

                var UPC            = item.UPC;
                var Description    = item.Description;
                var POSDescription = item.POSDescription;
                var SubCategory    = item.SubCategory;
                var Aisle          = item.Aisle;  // created by taking Aisle info from Sobeys and removing shelf id from the end 
                var AisleShelf     = item.AisleShelf;  // created from full Aisle info from Sobeys
                var Position       = item.Position;                

                var shelf = item.AisleShelf;    
                console.log('about to look for blockcoordinates of this upc: '+UPC);
                
                BlockCoordinates.findOne({ 'UPC' :  UPC }, function(err, blockCoordinates) {
                    if (err){
                        console.log("error trying to find blockcoords: " + err);                    
                    } else if (blockCoordinates) {                                               

                        GroceryItem.find({'AisleShelf' : shelf}).sort('Position').exec(function(err, groceryItems) {
                                if(err) {
                                    console.log(err);
                                    res.send(err)
                                } else if(groceryItems) {
                                    console.log("found: " + groceryItems.length + " groceryItems on the same shelf!");                      

                                    var dist = 0;
                                    var itemDist;
                                    var dbCallFinished = false; 

                                    function asyncLoop( i, callback ) {
                                        if( i < groceryItems.length ) {
                                            if(groceryItems[i].UPC == UPC) {                                                        
                                                console.log("yay found the item");
                                                itemDist = dist;
                                                asyncLoop( i+1, callback );                                                    
                                            } else {                                                                                                
                                                ItemWidth.findOne({
                                                    'UPC': UPC
                                                }, function(err, item){
                                                    if(err)
                                                        console.log('error occurred while trying to find width: ' + err);
                                                        res.send(err);
                                                    if(item){
                                                        //console.log('found and adding width: ');
                                                        //console.log(item.Width);
                                                        dist += item.Width; // in inches --> width of whole aisle / number of positions in aisle 
                                                        asyncLoop( i+1, callback );                                                    
                                                    } else {
                                                        console.log('couldnt find this upc codes width');
                                                        res.send(404);
                                                    }
                                                })     
                                            }                                            
                                        } else {
                                            callback();
                                        }
                                    }   

                                    asyncLoop( 0, function() {
                                        // put the code that should happen after the loop here
                                        console.log('running code after async');                                                                                                                                                                    

                                        console.log('item distance is: ' + itemDist);
                                        console.log('width of aisle is: ' + dist);

                                        var distPerc = itemDist/dist;
                                        console.log('distance percentage to item is: ' + distPerc);
                                        console.log("X2: " + blockCoordinates.x2 + ", X1: " + blockCoordinates.x1);
                                        var blockDist = blockCoordinates.x2 - blockCoordinates.x1;
                                        console.log('block length: '+blockDist);

                                        var itemx =  distPerc * blockDist;                                                                        

                                        var itemCoordinates = {x : itemx, y : blockCoordinates.y1};                                    
                                        console.log("Item coordinates: ");
                                        console.log(itemCoordinates);                                                                                                            

                                        GroceryItem.findOneAndUpdate({ 'UPC': UPC }, {
                                            UPC            : UPC,
                                            Description    : Description,
                                            POSDescription : POSDescription,
                                            SubCategory    : SubCategory,
                                            Aisle          : Aisle,  // created by taking Aisle info from Sobeys and removing shelf id from the end 
                                            AisleShelf     : AisleShelf,  // created from full Aisle info from Sobeys
                                            Position       : Position,
                                            Coordinates    : itemCoordinates                               
                                        }, function(err, item){
                                            if(err) {
                                                console.log("error trying to find groceryItem: " + err);    
                                                res.send(err)                
                                            } else if(item) {
                                                console.log('successfully found and set coordinates');
                                                console.log(item);                                                
                                                //res.send(item);                                                
                                            } else {
                                                console.log('could not update coordinates of grocery item');  
                                                res.send('could not update coordinates of grocery item');         
                                            }
                                        });
                                    });

                                } else {
                                    console.log(404);
                                    res.send(404);
                                }
                            });         

                    } else {
                        console.log("could not find block coordinates for this UPC code");
                        res.send("could not find block coordinates for this UPC code");
                    }
                });
            } else {
                console.log('ahoy');
                res.send(404)
            }
        })
    })

    app.get('/userlocation', isAuthenticated, function(req, res){
        User.findOneAndUpdate({
            'Email': req.user.Email
        }, function(err, user){
            if(err)
                res.send(err)
            if(user){
                var location = {
                    StoreName   : user.StoreName,
                    Latitude    : user.Latitude,
                    Longitude   : user.Longitude
                }

                res.send(location)
            }
            else
                res.send(404)
        })
    })

    app.post('/setuserlocation', isAuthenticated, function(req,res){
        User.findOneAndUpdate({
            'Email': req.user.Email
        },{
            StoreName   : req.body.StoreName,
            Latitude    : req.body.Latitude,
            Longitude   : req.body.Longitude
        }, function(err, user){
            if(err)
                res.send(err)
            if(user)
                res.send(user)
            else
                res.send(404)
        })
    })

    app.post('/deletegroceryitems', isAuthenticated, function(req, res){
        GroceryList.findOneAndUpdate({
            'User': req.user,
            'GroceryListName': req.body.GroceryListName
        },{
            'List': []
        },{
            safe:true, upsert:true, new: true
        },
        function(err, groceryList){
            if(err)
                res.send(err)
            if(groceryList)
                res.send(groceryList)
        })
    })

    app.post('/deletegroceryitem', isAuthenticated, function(req, res){
        GroceryList.findOne({
            'User': req.user,
            'GroceryListName': req.body.GroceryListName
        }, function(err, groceryList){
            if(err)
                res.send(err)
            if(groceryList){
                for(var i = 0; i < groceryList.List.length; i++){
                    if(groceryList.List[i]._id == req.body._id){

                        groceryList.List.splice(i, 1);

                         GroceryList.findOneAndUpdate({
                            'User': req.user,
                            'GroceryListName': req.body.GroceryListName
                        },{
                            'List': groceryList.List
                        },{
                            safe:true, upsert:true, new: true
                        },
                        function(err, groceryList){
                            if(err)
                                res.send(err)
                            if(groceryList){
                                res.send(groceryList)
                            }
                        })
                    }
                }
            }else{
                res.send(404);
            }
        })
    })

    app.post('/crossoutitem', isAuthenticated, function(req, res){
        GroceryList.findOne({
            'User': req.user,
            'GroceryListName': req.body.GroceryListName
        }, function(err, groceryList){
            if(err)
                res.send(err)
            if(groceryList){
                for(var i = 0; i < groceryList.List.length; i++){
                    if(groceryList.List[i]._id == req.body._id){
                        groceryList.List[i].CrossedOut = req.body.CrossedOut
                         GroceryList.findOneAndUpdate({
                            'User': req.user,
                            'GroceryListName': req.body.GroceryListName
                        },{
                            'List': groceryList.List
                        },{
                            safe:true, upsert:true, new: true
                        },
                        function(err, groceryList){
                            if(err)
                                res.send(err)
                            if(groceryList)
                                res.send(groceryList)
                        })
                    }
                }
            }else{
                res.send(404);
            }
        })
    })

    app.post('/editgroceryitemcomment', isAuthenticated, function(req, res){
        GroceryList.findOne({
                'User': req.user,
                'GroceryListName': req.body.GroceryListName
            }, function(err, groceryList){
                if(err)
                    res.send(err)
                if(groceryList){
                    for(var i = 0; i < groceryList.List.length; i++){
                        if(groceryList.List[i]._id == req.body._id){
                            console.log(req.body.Comment)
                            groceryList.List[i]["Comment"] = req.body.Comment
                            console.log(groceryList.List[i])
                             GroceryList.findOneAndUpdate({
                                'User': req.user,
                                'GroceryListName': req.body.GroceryListName
                            },{
                                'List': groceryList.List
                            },{
                                safe:true, upsert:true, new: true
                            },
                            function(err, groceryList){
                                if(err)
                                    res.send(err)
                                if(groceryList)
                                    res.send(200)
                            })
                        }
                    }
                }else{
                    res.send(404);
                }
            })
    })
    
    //Deprecated
    // app.post('/editgroceryitem', isAuthenticated, function(req, res){
    //     GroceryList.findOne({
    //             'User': req.user,
    //             'GroceryListName': req.body.GroceryListName
    //         }, function(err, groceryList){
    //             if(err)
    //                 res.send(err)
    //             if(groceryList){
    //                 for(var i = 0; i < groceryList.List.length; i++){
    //                     if(groceryList.List[i]._id == req.body._id){
    //                         groceryList.List[i].ItemName = req.body.ItemName
    //                         groceryList.List[i].Quantity = req.body.Quantity
    //                         groceryList.List[i].Comment = req.body.Comment
    //                          GroceryList.findOneAndUpdate({
    //                             'User': req.user,
    //                             'GroceryListName': req.body.GroceryListName
    //                         },{
    //                             'List': groceryList.List
    //                         },{
    //                             safe:true, upsert:true, new: true
    //                         },
    //                         function(err, groceryList){
    //                             if(err)
    //                                 res.send(err)
    //                             if(groceryList)
    //                                 res.send(200)
    //                         })
    //                     }
    //                 }
    //             }else{
    //                 res.send(404);
    //             }
    //         })
    // })

    app.delete('/deletegrocerylist', isAuthenticated, function(req,res){
        GroceryList.findOneAndRemove({
                'User': req.user,
                'GroceryListName': req.body.GroceryListName
            }, function (err, groceryList){
            if(err) 
                res.send(err)
            if(groceryList){
                for(var i = 0; i < req.user.GroceryList.length; i++){
                    var userClone = clone(req.user)

                    if(req.user.GroceryList[i].toString() == groceryList._id.toString()){

                        var index = userClone.GroceryList.indexOf(groceryList._id)
                    
                        console.log("Index: " + index)
                        userClone.GroceryList.splice(index, 1);


                        User.findOneAndUpdate({
                            'Email': userClone.Email
                        },{
                            'GroceryList': userClone.GroceryList
                        },function(err,user){
                            if(err)
                                res.send(err)
                            if(user)
                                res.send(user)
                            else
                                res.send(404)
                        })
                    }else{
                        res.send(500)
                        console.log('else here')
                    }
                }
            }
            else{
                console.log("here")
                res.send(404)
            }
        })
    })

    app.get('/grocerylists', isAuthenticated, function(req,res){
        GroceryList.find({
            'User':req.user
        }, function(err, grocerylists){
            if(err)
                res.send(err)
            if(grocerylists)
                res.send(grocerylists)
            else
                res.send(404)
        })
    })

    app.post('/addtolist', isAuthenticated, function(req, res) {
        for(var i = 0; i < req.body.List.length;i++){
             GroceryList.findOneAndUpdate({
                'User': req.user,
                'GroceryListName': req.body.GroceryListName
            },{
                $push:{'List': req.body.List[i]}
            },{
                safe:true, upsert:true, new: true
            },
            function(err, groceryList){
                if(err)
                    res.send(err)
                if(groceryList)
                    res.send(200)
            })
        }
    });

    app.post('/newgrocerylist', isAuthenticated, function(req, res) {

        var newGroceryList = new GroceryList({
            'User'              : req.user,
            'GroceryListName'   : req.body.GroceryListName
        });

        newGroceryList.save(function(err, newGroceryList){
            if(err)
                res.send(err)
            if(newGroceryList){
                User.findOneAndUpdate({
                    'Email': req.user.Email
                },{
                    $push:{'GroceryList':newGroceryList}
                },{
                    safe:true, upsert:true, new: true
                },
                function(err,user){
                    if(err)
                        res.send(err)
                    if(user)
                        res.send(user)
                })
            }
        })
    });


    app.post('/createuser', passport.authenticate('signup', {
        successRedirect : '/createuser', // redirect to the secure profile section
        failureRedirect : '/createuser/fail', // redirect back to the signup page if there is an error
        // failureFlash : true // allow flash messages
    }));

    app.get('/createuser', isAuthenticated, function(req,res){
        console.log('testing the sign up')
        res.send(req.user)
    })

    app.get('/createuser/fail', function(req,res){
        var fail = 'Creating a user failed.'
        console.log(fail)
        res.status(500).send({message: fail})
    })

    app.post('/login', passport.authenticate('login', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/login/fail', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.get('/login/fail', function(req,res){
        var fail = 'Logging in failed.'
        console.log(fail)
        res.status(500).send({message: fail})
    })

    app.get('/home', isAuthenticated, function(req,res){
        res.status(200).send(req.user)
    })

    app.get('/loggedin', isAuthenticated, function(req,res){
        res.send(req.user)
    })

    app.post('/logout', logout, function(req,res){
        res.send({
            status:200,
            message:'bye'
        })
    });
}

var logout = function(req, res, next){
    req.logout()
    req.session.destroy();
    return next()
}

var isAuthenticated = function (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response object
    if (req.isAuthenticated()){
        console.log('User is authenticated')
        return next();
    }
    // if the user is not authenticated then redirect him to the login page
    var fail = 'Sorry a user is not logged in'
    console.log(fail)
    res.send({'status': false});
}
