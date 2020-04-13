//1.Sell a book to a customer.
//here two collection wil be affected (Customer and Order)
//inserting a new document to the order document
//after that updating the customer document by inserting the orderNo that we have created in the orderNo array
var Order = {
    _id : 16,
    date : "2020-04-10",
    book : [ 
        {
            price : NumberDecimal("100.0"),
            ISBN : "a2",
            qty : NumberInt(1)
        }, 
    ],   
}
          
db.Order.insert(Order)

db.Customer.update({_id:1},{$push:{orderNo:16}})

db.getCollection("Order").find({})
db.getCollection("Customer").find({})


//2.Change the address of a customer.

db.Customer.update({_id:1},{$set:{'address.street':'street1.1'}})


//3.Add an existing author to a book.
//since the author is already there, so the only thing is to push that author to 
//the Author array in Book ducument 
db.Book.update({ISBN:'a1'},{$push:{author:3}})

db.getCollection("Book").find({})

//4.Retire the "Space Opera" category and assign all books from that category to the parent category. 
//Don't assume you know the id of the parent category.
//first find the category document where the name = space opera
//second update thev table book and assign the category id to the parent category id
//finally delete all the documents with the name = space opera from the category collection
db.Category.find( { name: { $eq: "Space Opera" } } )
db.getCollection("Category").find({})

db.Book.update({category: { $eq: "Space Opera"}},{$set:{'category':'Science Fiction'}})
db.getCollection("Book").find({})

db.Category.remove({ name: "Space Opera"})
db.getCollection("Category").find({})


//5.Change a book from Non-fiction to fiction, or vice versa.
// change Non-Fiction to Fiction
//here am changing all the books from Non-Fiction to Fiction
db.Book.update({category: { $eq: "Non-Fiction"}},{$set:{'category':'Fiction'}})
db.getCollection("Book").find({})
//to chnage only one specifiv book 
db.Book.update({_id:1},{$set:{'category':'Fiction'}})


//6.Retire the "Fantasy and Science Fiction" category and just use either "Fantasy" or "Science Fiction"
//first update the category collection: parent to Fiction
//second update the Book collection: category to Fiction
//delete all the documents in Category collection where name = Fantasy and Science Fiction 
db.Category.update({parent: { $eq: "Fantasy and Science Fiction"}},{$set:{'parent':'Fiction'}})

db.Book.update({name: { $eq: "Fantasy and Science Fiction"}},{$set:{'name':'Fiction'}})


db.Category.remove({ name: "Fantasy and Science Fiction"})
db.getCollection("Category").find({})

// 7.	Sell 3 copies of one book and 2 of another in a single order
// here what needs to be changed is the Order collection
//one new document will be added
var Order = {
    _id : 15,
    date : "2020-04-10",
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
   
}


           
db.Order.insert(Order)

db.getCollection("Order").find({})







