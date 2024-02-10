const fs = require('fs').promises;
const asyncHandler = require('express-async-handler');


const path = require('path');
require('dotenv').config();
const Product = require('../models/productModel');

const storeTo = process.env.STORE_TO;
const filePath = path.join(__dirname, '../data/products.json');

const generateRandomId = () => Math.floor(Math.random() * 10000000);

const readProductsFromFile = async () => {
  try {
    const productData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(productData);
  } catch (error) {
    return [];
  }
};

const writeProductsToFile = async (products) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(products, null, 2), 'utf8');
  } catch (error) {
    return error;
  }
};

// endpoint to add products
const addProducts = asyncHandler(async (req, res) => {
  try {
    const { title, description, rating, price, category, quantity } = req.body;
    if (!title || !description || !rating || !price || !category || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    let imageFile = req.files? req.files.map(file => file.path):[];

    if (storeTo === 'FS') {
      const products = await readProductsFromFile();

      const productId = generateRandomId();

      const newProduct = {
        _id: productId,
        title,
        price,
        description,
        quantity,
        category,
        rating,
        image:imageFile.length > 0 ? imageFile :null,
      };
      products.push(newProduct);
      await writeProductsToFile(products);

      // res.status(200).json(newProduct);
      res.redirect('/products');
    } else if (storeTo === 'DB') {
      const newProduct = new Product({
        title,
        description,
        rating,
        category,
        price,
        quantity,
        image:imageFile.length > 0 ? imageFile :null
      });

      const savedProduct = await newProduct.save();
      // res.status(200).json(savedProduct);
      res.redirect('/products');
    } else {
      return res.status(500).json({ message: 'Invalid Storage Configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to get the products with the query
const getProducts = asyncHandler(async (req, res) => {
  const { search, sort, filter } = req.query;
  
  try {
    if (storeTo === 'FS') {
      const userId = req.user.id;
      let products = await readProductsFromFile();

      const searchProducts = (products, search) => {
        return search
          ? products.filter(
              (product) =>
                product.title.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search)
            )
          : products;
      };
      const sortProducts = (products, sort) => {
        return sort === 'price'
          ? [...products].sort((a, b) => b.price - a.price)
          : products;
      };

      const filterProducts = (products, filter) => {
        return filter
          ? products.filter(
              (product) => product.category.toLowerCase() === filter
            )
          : products;
      };

      products = searchProducts(products, search);
      products = sortProducts(products, sort);
      products = filterProducts(products, filter);

      if (products.length === 0) {
        return res.status(404).json({ message: 'Products not found' });
      }
      res.render('products',{products:products,userId:userId});
    } else if (storeTo === 'DB') {
      const userId = req.user._id;
      let products = await Product.find();

      const searchProducts = (products, search) => {
        return search
          ? products.filter(
              (product) =>
                product.title.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search)
            )
          : products;
      };
      // Function to sort products by price
      const sortProducts = (products, sort) => {
        return sort === 'price'
          ? [...products].sort((a, b) => a.price - b.price)
          : products;
      };

      // Function to filter products by product type
      const filterProducts = (products, filter) => {
        return filter
          ? products.filter(
              (product) => product.category.toLowerCase() === filter
            )
          : products;
      };
      // apply search,sort and filter
      products = searchProducts(products, search);
      products = sortProducts(products, sort);
      products = filterProducts(products, filter);

      if (products.length === 0) {
        return res.status(404).json({ message: 'product not available' });
      }
   
      // res.status(200).json(products);
      res.render('products',{products:products,userId:userId});
    } else {
      return res.status(500).json({ message: 'Invalid Storage Configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint to  get specific products
const getSpecificProduct = asyncHandler(async (req, res) => {
  
  try {
  
    if (storeTo === 'FS') {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      const products = await readProductsFromFile();

      const index = products.findIndex((product) => product._id === productId);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // res.status(200).json(products[index]);
       res.render('productdetail', { userId,product: products[index] }); 
    } else if (storeTo === 'DB') {
      const userId = req.user._id;
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product Not Found' });
      }
      res.render('productdetail',{userId,product});
    } else {
      return res.status(500).json({ message: 'Invalid Storage Configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  end point to get the out of stock products
const getStock = asyncHandler(async (req, res) => {
    try {
        if (storeTo === "FS") {
            const products = await readProductsFromFile();
            const outOfStock = products.filter(product => product.quantity < 5);
            res.status(200).json(outOfStock);
        } else if (storeTo === "DB") {
            const outOfStock = await Product.find({ quantity: { $lt: 5 } });
            res.status(200).json(outOfStock);
        } else {
            return res.status(500).json({ message: "Invalid Storage Configuration" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// endpoint to update all the fields using put
const updateProduct = asyncHandler(async (req, res) => {
    const { title, description, price, quantity, category, rating } = req.body;

    try {
        if(storeTo === "FS"){
          const productId = parseInt(req.params.productId);
          const products = await readProductsFromFile();
          const index = products.findIndex(product => product.id === productId);
  
          if (index === -1) {
              return res.status(404).json({ message: "Product not found" });
          }
  
          const updatedProduct = { title, description, price, quantity, category, rating };
          products[index] = { ...products[index], ...updatedProduct };
          await writeProductsToFile(products);
  
          res.status(201).json({ message: "Product Updated Successfully", updatedProduct });
        }else if(storeTo === "DB"){
          const productId = req.params.productId;
          const updatedProduct = await Product.findByIdAndUpdate(productId,{
            title,
            description,
            price,
            category,
            rating,
            quantity

          },{new:true});

          if(!updatedProduct){
            return res.status(404).json({message:"Product not found"});
          }
          res.status(200).json({message:"Product Updated Successfully",updatedProduct});

        }else{
          return res.status(500).json({message:"Invalid Storage Configuration"});
        }
      
       
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// endpoint to patch the products quantity
const patchProducts = asyncHandler(async(req,res) => {
  const {quantity}= req.body;
  try {
    if(storeTo === "FS"){
      const productId = parseInt(req.params.productId);
    
    const products = await readProductsFromFile();
    const index = products.findIndex((product) =>product.id === productId);

    if(index === -1){
      return res.status(404).json({message:"Product Not found"});
    }
    products[index].quantity = quantity;
    await writeProductsToFile(products);
    res.status(200).json({message:"Product Quantity Updated",product:products[index]});

    }else if(storeTo === "DB"){
      const productId = req.params.productId;

      const updatedProduct = await Product.findByIdAndUpdate(productId,{
        quantity
      },{new:true});

      if(!updatedProduct){
        return res.status(404).json({message:"Product not found"});
      }

      res.status(200).json({message:"Product Quantity updated",product:updatedProduct});
      
    }else{
      return res.status(500).json({message:"Invalid Storage Configuration"});
    }
    
  } catch (error) {
    res.status(500).json({error:error.message});
  }
})



module.exports = { addProducts, getProducts, getSpecificProduct,getStock,updateProduct,patchProducts };
