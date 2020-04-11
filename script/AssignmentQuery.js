////////////////////////////////////////////////////////////////////////////////////////
1.all books by an author


var authorId = db.author.find({name:'Bodil toft'},{_id:1}).next()._id

var matchAuthor = {$match: {author:12}}
        
var unwindAuthorArray = {$unwind:{ path:'$author' , preserveNullAndEmptyArrays:true}}
    
var projectBookAuthor={$project:{author:1,ISBN:1}}    

var groupBooksByAuthor = { $group: { _id : '$author',books:{$addToSet:'$ISBN'}    }  }
    
    
db.book.aggregate([unwindAuthorArray,matchAuthor,projectBookAuthor,groupBooksByAuthor])



______________-



2. total price of an order

var booksTotalPice=  {
        $addFields: {
            book: {
                $map: {
                    input: "$book",
                    in: {
                        $mergeObjects: [
                            "$$this",
                            { total: { $multiply: [ "$$this.qty", "$$this.price" ] } }
                        ]
                    }
                }
            }
        }
    }

var unwind={$unwind:{path:'$book'}}
var groupByOrderId = {   $group:{ _id:'$_id', TotalSale:{$sum:'$book.total'} }}

db.order.aggregate([booksTotalPice,unwind,groupByOrderId])


//or 



var map = function() {
                       for (var idx = 0; idx < this.book.length; idx++) {
                           var key = this._id;
                           var total = {                                  
                                        totalSale: this.book[idx].qty * parseFloat(this.book[idx].price.toJSON()["$numberDecimal"])
                                       };
											emit(key, total); 
                                       }
                    };
                    
                    
var reduce = function(keyId, ObjVals) {
                        var total = 0;
                     for (var idx = 0; idx < ObjVals.length; idx++) {
                         total += ObjVals[idx].totalSale;
							}
                     return total;
                  };                    

db.order.mapReduce( map, reduce,  {  out: "orderTotal",    query: { _id: 1 },    }       )
db.orderTotal.find()



__________________________________

3.total sale for a cutomer

var cutomer= {    $match:{ name:{$eq:'Clause'}    }   }
var unwindordersArray = {    $unwind:{path:'$orderNo' ,  preserveNullAndEmptyArrays:true  }   }
var joinCustomerOrders = {   $lookup:{ from:'order', foreignField:'_id', localField:'orderNo',  as : 'Customer_Order'    }   }    
var groupByCutomerId =  {    $group:{ _id:'$_id',  name:{$max:'$name'},   email:{$max:'$email'},   orderNo:{$addToSet:'$orderNo'},   orders:{$addToSet:'$Customer_Order'}       }}
var unwindBooksObjectArray = {   $unwind:{path:'$Customer_Order.book' ,   preserveNullAndEmptyArrays:true  }    }
        

db.customer.aggregate([cutomer,unwindordersArray,joinCustomerOrders,unwindBooksObjectArray,groupByCutomerId])
_____________________________________________

4.	Books that are categorized as neither fiction nor non-fiction

var unwindedCatgoryArrayBefore= {$unwind:{path:'$category', preserveNullAndEmptyArrays:true} }

var unwindedCatgoryArrayAfter = {$unwind:{path:'$book_category', preserveNullAndEmptyArrays:true} }

var lookupBookCataegory = { $lookup:{from:'category', foreignField:'name',localField:'category',as : 'book_category'  }};

var matchBooksCategory = {$match:{ 'book_category.name':{$nin:['Non-Fiction','Fiction']}}}

db.book.aggregate([unwindedCatgoryArrayBefore,lookupBookCataegory,unwindedCatgoryArrayAfter,matchBooksCategory])


__________________________________
5.	Average page count by genre

var unwindedCatgoryArrayBefore= {$unwind:{path:'$category', preserveNullAndEmptyArrays:true} }

var unwindedCatgoryArrayAfter = {$unwind:{path:'$book_category', preserveNullAndEmptyArrays:true} }

var lookupBookCataegory = { $lookup:{from:'category', foreignField:'name',localField:'category',as : 'book_category'  }};

var groupByAveragePagesByGenre = {$group:{_id:'$book_category.name', 'average pages':{$avg:'$pages'}}}

db.book.aggregate([unwindedCatgoryArrayBefore,lookupBookCataegory,unwindedCatgoryArrayAfter,groupByAveragePagesByGenre])

__________________________________

6.	Categories that have no sub-categories

var parents = db.category.find({},{parent:1,_id:0}).map( (parent) => parent.parent )
db.category.find({name:{$nin:parents}})

___________

7.ISBN numbers of books with more than one author
db.book.find({author:{$size:2 }}).count()  
		
		
__________________________________
8.ISBN numbers of books that sold at least X copies (you decide the value for X)		
		
		
var unwindBooksArray = {$unwind:{   path:'$book'}} 

var groupByQty = {$group:{_id:'$book.ISBN',sold_copies:{$sum:'$book.qty'}}}

var matchSallingNumber= {$match:{sold_copies:{$gt:10}}}

db.order.aggregate([unwindBooksArray,groupByQty,matchSallingNumber])
__________________________________


9.Number of copies of each book sold – unsold books should show as 0 sold copies.see page 112 find all books and subtract the array of isbns and then project every thing var unwindBooksArray = {$unwind:'$book'}var joinBookOrder = { $lookup:{from:'book', foreignField:'ISBN',localField:'book.ISBN',as : 'booksDetails'  }};var unwindBooksDetailsArray = {$unwind:'$booksDetails'}var groupByISBN = {$group:{ _id:'$book.ISBN',title:{$max:'$booksDetails.title'},quantity_Sold :{$sum:'$book.qty'}}}var booksSaling = db.order.aggregate([unwindBooksArray,joinBookOrder,unwindBooksDetailsArray,groupByISBN]).toArray()var soldBooks = booksSaling.map( x => x._id ).sort()var unsoldBooks = db.book.aggregate([{$match:{ISBN:{$nin:soldBooks}}},{$project:{ ISBN:1,title:1,quantity_Sold:{$literal:0}}}]).toArray()       db.order.aggregate([     { $project: { books: { $setUnion: [ unsoldBooks, booksSaling] },_id:0}},{$unwind:'$books'},     {$group:{_id:'$books._id',title:{$max:'$books.title'},quantity_Sold :{$max:'$books.quantity_Sold'}}}  ])                            

______________-

10.Best-selling books: The top 10 selling books ordered in descending order by number of sales.

var unwindBooksArray = {$unwind:'$book'}

var rightJoinBookOrder = { $lookup:{from:'book', foreignField:'ISBN',localField:'book.ISBN',as : 'booksDetails'  }};

var unwindBooksDetailsArray = {$unwind:'$booksDetails'}

var groupByISBN = {$group:{ _id:'$book.ISBN',title:{$max:'$booksDetails.title'},quantity_Sold :{$sum:'$book.qty'}}}

var sortByTopSallingBook={$sort:{'quantity_Sold':-1}}

var Limit10 = {$limit:10}

db.order.aggregate([unwindBooksArray,rightJoinBookOrder,unwindBooksDetailsArray,groupByISBN,sortByTopSallingBook,Limit10])


______

11.	Best-selling genres: The top 3 selling genres ordered in descending order by number of sales.



var unwindBooksArray = {$unwind:'$book'}

var rightJoinBookOrder = { $lookup:{from:'book', foreignField:'ISBN',localField:'book.ISBN',as : 'booksDetails'  }};

var unwindBooksDetailsArray = {$unwind:'$booksDetails'}

var groupByISBN = {$group:{ _id:'$book.ISBN',title:{$max:'$booksDetails.title'},category:{$max:'$booksDetails.category'},quantity_Sold :{$sum:'$book.qty'}}}

var unwindCategoryArray = {$unwind:'$category'}

var sortByTopSallingGenre={$sort:{'salling':-1}}

var joinCategory={$lookup:{from:'category',foreignField:'name',localField:'category',as:'category_name'}}

var unwindCategoryName = {$unwind:'$category_name'}

var groupByCategoryName= {$group:{_id:'$category_name.name',salling:{$sum:'$quantity_Sold'}}}


db.order.aggregate([unwindBooksArray,rightJoinBookOrder,unwindBooksDetailsArray,groupByISBN,
unwindCategoryArray,joinCategory,unwindCategoryName,groupByCategoryName,sortByTopSallingGenre])


____________________


12.All science fiction books (Hint: Google "Recursive with")

db.category.aggregate( [
   {$match:{parent:'Science Fiction'}},
   {
      $graphLookup: {
         from: "book",
         startWith: "$name",
         connectFromField: "name",
         connectToField: "category",
         as: "Books"
      }
   }
] )





__________________________________________________

13.	Characters used in science fiction books
var graph = {
      $graphLookup: {
         from: "book",
         startWith: "$name",
         connectFromField: "name",
         connectToField: "category",
         as: "books"
      }
   }
var match =  {$match:{parent:'Science Fiction'}}

var unwindBooks = {$unwind:'$books'}

var charatersGyoupedByScienceFiction = {$group:{_id:'$parent',characters:{$addToSet:'$books.cahracter'}}}


db.category.aggregate( [match  ,graph,unwindBooks,charatersGyoupedByScienceFiction] )

____________________

14.Number of books in each category

var unwindCategory = {$unwind:'$category'}

var joinCategory = {$lookup:{from:'category',foreignField:'name',localField:'category',as : 'category_Name'}}

var unwindCategoryName = {$unwind:'$category_Name'}

var groupByCategoryName = {$group:{_id:'$category_Name.name',NumberOfBooks:{$sum:1},books:{$addToSet:'$ISBN'}}}

db.book.aggregate([unwindCategory,joinCategory,unwindCategoryName,groupByCategoryName])

____









