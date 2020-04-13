//1.All books by an author
//assuming that we only know the name of the author
//first find what is the id of that author
db.Author.find( { name: { $eq: "Poul" } } )
//second find all the Books that have this author id.
db.Book.find( { author: { $eq: 5 } } )

//2.Total price of an order
db.Order.aggregate([
    // Unwind the array to de-normalize as documents
    { "$unwind": "$book" },

    // Group on the key you want and provide other values
    { "$group": { 
        _id: '$_id' ,
           totalAmount: { $sum: { $multiply: [ "$book.qty", "$book.price" ] } }
    }}
])

db.getCollection("Order").find({})


//3.Total sales to a customer
//here the solution would be correct only if there is an reference of the 
//customer collection (IDs) is the order collection.
db.Order.aggregate([
    // Unwind the array to de-normalize as documents
    { "$unwind": "$book" },

    // Group on the key you want and provide other values
    { "$group": { 
        _id: "$customerNo" ,
           totalAmount: { $sum: { $multiply: [ "$book.qty", "$book.price" ] } }
    }}
])



//4.Books that are categorized as neither fiction nor non-fiction
db.Book.find( { category: { $nin: [ "Fiction", "Non-Fiction" ] } } )

//5.Average page count by genre
//we do not have genre, so use category instead
db.Book.aggregate(
   [
     {
       $group:
         {
           _id: "$category",
           avgPages: { $avg: "$pages" }
         }
     }
   ]
)

//6.Categories that have no sub-categories

var parents = db.Category.distinct("parent")
db.Category.find({name:{$nin:parents}})


//7.ISBN numbers of books with more than one author
db.Book.find( { $where: "this.author.length > 1" } );


//8 ISBN numbers of books that sold at least X copies (you decide the value for X)
db.Order.aggregate([
    // Unwind the array to de-normalize as documents
    { "$unwind": "$book" },

    // Group on the key you want and provide other values
    { "$group": 
        { 
        _id: '$book.ISBN' ,
           totalQty: { $sum: '$book.qty'}        
        }},
     {"$match": {totalQty: {"$gt": 5}}}
])




//10.Best-selling books: The top 10 selling books ordered in descending order by number of sales.
db.Order.aggregate([
    { "$unwind": "$book" },
    { "$group": 
        { 
        _id: '$book.ISBN' ,
           totalQtySold: { $sum: '$book.qty'}        
        }},
         top10Sold = {$limit:10},
         sortByTop10 = {$sort:{'totalQtySold':-1}}
     
         
])





//12.All science fiction books (Hint: Google "Recursive with")
db.Category.aggregate( [
   {$match:{parent:'Science Fiction'}},
   {
//because the collection is recursive we use $graphLookup
      $graphLookup: {
         from: "Book",
         startWith: "$name",
         connectFromField: "name",
         connectToField: "category",
         as: "Books"
      }
   }
] )

//13.Characters used in science fiction books
db.Category.aggregate( [
   {$match:{parent:'Science Fiction'}},
   {

      $graphLookup: {
         from: "Book",
         startWith: "$name",
         connectFromField: "name",
         connectToField: "category",
         as: "Books"
      }
   },
   
   { "$unwind": "$Books" },
    { "$group": 
        { 
        _id: '$parent' ,
           characters:{$addToSet:'$Books.cahracter'        
        }}}
   
] )



//14.Number of books in each category
db.Book.aggregate([
   
    { "$group": 
        { 
        _id: '$category' ,
           numberOfCopies: { $sum: '$copies'}        
        }}
        
])





