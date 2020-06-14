db.loadServerScripts();


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
		
			//rollback
			for (i = 0; i < books.length; i++) {
					arrayOfOperations.push(updateBook(books[i].ISBN, category.name));
											}
					db.book.bulkWrite(arrayOfOperations);
			}
			 else{
			db.category.remove({name:category.name})
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