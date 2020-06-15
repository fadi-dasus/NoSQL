1.	Sell a book to a customer.
7.	Sell 3 copies of one book and 2 of another in a single order

//successful scenario
db.loadServerScripts();

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




   
   
   
applyPendingOrder(order)
   
var result = db.order.update({_id:order._id,state:'pending'},
{$set:{state:'applied'},$currentDate:{lastModified:true}})   

result.nModified


var result = removePendingOrder(order)
result
  

var result = db.order.update({_id:order._id,state:'applied'},
{$set:{state:'done'},$currentDate:{lastModified:true}})   



_______

//unsuccesful scenario 
#not enough copies (the order must fail and then we will rollback)
db.loadServerScripts();

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


db.order.insert(initialOrder)

var result = db.order.update({_id:initialOrder._id,state:'initial'},
{$set:{state:'pending'},$currentDate:{lastModified:true}})

result.nModified

var myOrder = db.order.find({_id:initialOrder._id})


var result = applyPendingOrder(initialOrder)
 
result // false


var failedItems = getFailedItems(initialOrder)

failedItems
   

var result = db.order.update({_id:initialOrder._id,state:'pending'},
{$set:{state:'cancelling'},$currentDate:{lastModified:true}})

result.nModified   


var success = revertCancellingOrder(initialOrder,failedItems)

success
  
   
______________

2.	Change the address of a customer.

db.customer.update({_id:1},{$set:{'address.street':'newStreetName'}})
_______________________________

3.	 Add an existing author to a book.
var author = db.author.find({_id:4}).next()._id
db.book.update({ISBN:'a1'},{$addToSet:{author:author}})
_______________________________

4.	Retire the "Space Opera" category and assign all books from that category to the parent category. Don't assume you know the id of the parent category.
6.	Retire the "Fantasy and Science Fiction" category and just use either "Fantasy" or "Science Fiction"

db.loadServerScripts();
   
var category = db.category.find({name:'Space Opera'}).next()
var books = db.book.find({category:{$elemMatch:{$eq:category.name}}}).toArray() 
books 


var result = updateBookCategory(books,category)

result


___________________________________
5.	Change a book from Non-fiction to fiction, or vice versa.
db.book.update({_id:1},{$set:{category:['Non-Fiction']}})
_____________________________________





