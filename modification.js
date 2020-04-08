1.	Sell a book to a customer.
8.	Sell 3 copies of one book and 2 of another in a single order

//successful scenario

var order = {
    _id : 18,
    date : "2020-05-11",
    book : [ 
        {
            price : NumberDecimal("10.0"),
            ISBN : "a1",
            qty : NumberInt(3)
        }, 
        {
            price : NumberDecimal("100.0"),
            ISBN : "a2",
            qty : NumberInt(2)
        }
    ],
    state : "initial"
}


           
db.order.insert(order)


var result = db.order.update({_id:order._id,state:'initial'},
{$set:{state:'pending'},$currentDate:{lastModified:true}})

result.nModified




db.system.js.save(
   {
       
       
     _id : "applyPendingOrder" ,
     value : function(order) {
    return updateAllItems(order, pendingItemApplier);
}



   }
);

db.system.js.save(
   {
       
       
     _id : "pendingItemApplier" ,
     value : function(orderId, book) {
    return {
        updateOne: {
            filter: {
                ISBN: book.ISBN,
                pendingOrders: {$ne: orderId},
                copies: {$gte: book.qty}
            },
            update: {
                $inc: {copies: -book.qty},
                $addToSet: {pendingOrders: orderId}
            }
        }
    }
}




   }
);





db.system.js.save(
   {
       
       
     _id : "pendingItemRemover" ,
     value : function(orderId, book) {
    return {
        updateOne: {
            filter: {
                ISBN: book.ISBN,
                pendingOrders: orderId
            },
            update: {
                $pull: {pendingOrders: orderId}
            }
        }
    }
}



   }
);
   
   
   
   
   
   
   
   
db.system.js.save(
   {
       
       
     _id : "removePendingOrder" ,
     value : function(order) {
    return updateAllItems(order, pendingItemRemover);
}




   }
);
   


 
db.system.js.save(
   {
       
       
     _id : "updateAllItems" ,
     value : function(order, updateProducerFunction) {
    
    var successful = true;
    
    var arrayOfOperations = new Array();
    
    for (i = 0; i < order.book.length; i++) {
        arrayOfOperations.push(
            updateProducerFunction(order._id, order.book[i])
        );
    }
    
    var updateResult = db.book.bulkWrite(arrayOfOperations);
    
    if (updateResult.matchedCount != order.book.length) {
        successful = false;    
    }
    
    return successful;
}




   }
);



db.loadServerScripts();
   
   
   
applyPendingOrder(order)
   
var result = db.order.update({_id:order._id,state:'pending'},
{$set:{state:'applied'},$currentDate:{lastModified:true}})   

result.nModified


var result = removePendingOrder(order)
result
  

var result = db.order.update({_id:order._id,state:'applied'},
{$set:{state:'done'},$currentDate:{lastModified:true}})   



_______

//fail scenario 
#not enough copies (the order must fail and then we will rollback)

var initialOrder = {
    _id : 21,
    date : "2020-05-11",
    book : [ 
        {
            price : NumberDecimal("10.0"),
            ISBN : "a1",
            qty : NumberInt(1000)
        }, 
        {
            price : NumberDecimal("100.0"),
            ISBN : "a2",
            qty : NumberInt(1)
        }
    ],
    state : "initial"
}

db.order.remove({_id:21})

db.order.insert(initialOrder)

var result = db.order.update({_id:initialOrder._id,state:'initial'},
{$set:{state:'pending'},$currentDate:{lastModified:true}})

result.nModified

var myOrder = db.order.find({_id:initialOrder._id})


var result = applyPendingOrder(initialOrder)
 
result // false


db.system.js.save(
   {
     _id : "getFailedItems" ,
     value : function(order) {
    
    var allItemIds = new Array();
    
    for (i = 0; i < order.book.length; i++) {
        allItemIds.push(order.book[i].ISBN);
    }
    var cursor = db.book.find({
        ISBN: {$in: allItemIds},pendingOrders:{$elemMatch:{$eq:order._id}}
    })
    return cursor.toArray();
    
}

   }
);

db.loadServerScripts();


var failedItems = getFailedItems(initialOrder)

failedItems
   

var result = db.order.update({_id:initialOrder._id,state:'pending'},
{$set:{state:'cancelling'},$currentDate:{lastModified:true}})

result.nModified   




   
db.system.js.save(
   {
       
       
     _id : "revertCancellingOrder" ,
     value : function(order, failedItems) {
    
    var revertItems = new Array();
    for (i = 0; i < order.book.length; i++) {
        for ( j = 0; j < failedItems.length; j++){
            if (order.book[i].ISBN == failedItems[j].ISBN) {
                revertItems.push(order.book[i]);

            }
        }
    
         
    }
    
    order.book = revertItems; 

    return updateAllItems(order, cancellingItemReverter);
    
}
   }
);



db.system.js.save(
   {
     _id : "cancellingItemReverter" ,
     value: function(orderId, book) {
    return {
        updateOne: {
            filter: {
                ISBN: book.ISBN  ,
                pendingOrders: orderId
            },
            update: {
                $inc: {copies: book.qty},
                $pull: {pendingOrders: orderId}
            }
        }
    }
}


   }
);
   
 

 
db.system.js.save(
   {
       
       
     _id : "updateAllItems" ,
     value : function(order, updateProducerFunction) {
    
    var successful = true;
    
    var arrayOfOperations = new Array();
    
    for (i = 0; i < order.book.length; i++) {
        arrayOfOperations.push(
            updateProducerFunction(order._id, order.book[i])
        );
    }
    
    var updateResult = db.book.bulkWrite(arrayOfOperations);
    
    if (updateResult.matchedCount != order.book.length) {
        successful = false;    
    }
    
    return successful;
}




   }
);
   
   
db.loadServerScripts();


var success = revertCancellingOrder(initialOrder,failedItems)

success
  
   
______________

2.	Change the address of a customer.

db.customer.update({_id:1},{$set:{'address.street':'newStreetName'}})
_______________________________

3.	 Add an existing author to a book.
var author = db.author.find({_id:4}).next()._id
db.book.update({ISBN:'a1'},{$pull:{author:author}})
_______________________________

4.	Retire the "Space Opera" category and assign all books from that category to the parent category. Don't assume you know the id of the parent category.
7.	Retire the "Fantasy and Science Fiction" category and just use either "Fantasy" or "Science Fiction"

db.system.js.save(
   {      
     _id : "updateBookCategory" ,
     value : function(books, category) {
    
    var successful = true;
    
    var arrayOfOperations = new Array();
    
    for (i = 0; i < books.length; i++) {
        arrayOfOperations.push(
            updateBook(books[i].ISBN, category.parent)
        );
    }
    
    var updateResult = db.book.bulkWrite(arrayOfOperations);
    
    if (updateResult.matchedCount != books.length) {
        successful = false;    
    }
    
    if(successful == false){
        //rollback
        for (i = 0; i < books.length; i++) {
        arrayOfOperations.push(
            updateBook(books[i].ISBN, category)
        );
    }
        }
         if(successful == true){
        db.category.remove({name:category})
         }
    return successful;
}
   }
);
   
   
 
db.system.js.save(
   {    
     _id : "updateBook" ,
     value : function (ISBN, category) {
    return {updateOne:{filter: {ISBN:ISBN},update:{$set:{category:[category]}}}}

}
   }
);
   
var category = db.category.find({name:'Space Opera'}).next()
var books = db.book.find({category:{$elemMatch:{$eq:category}}}).toArray() 
books 
db.loadServerScripts();


var result = updateBookCategory(books,category)

result


___________________________________
6.	Change a book from Non-fiction to fiction, or vice versa.
db.book.update({_id:1},{$set:{category:['Non-Fiction']}})
_____________________________________





