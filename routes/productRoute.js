const express = require("express");
const router = express.Router();
const {addProducts, getProducts, getSpecificProduct, getStock, updateProduct, patchProducts}  = require('../controller/productController');
const { verifyAuth,isAdmin } = require('../middleware/authentication');

const { multipleUpload} = require('../middleware/uploadMiddleware')



router.post('/add',multipleUpload ,verifyAuth, isAdmin, addProducts);


router.get('/',verifyAuth,getProducts);

router.put('/update/:productId',verifyAuth,isAdmin,updateProduct);
router.get('/stock',verifyAuth,isAdmin,getStock);
router.patch('/quantity-update/:productId',verifyAuth,isAdmin,patchProducts);
router.get('/detail/:productId',verifyAuth,getSpecificProduct);


module.exports=router;
