const mysql = require('mysql');
const exp = require("express");
const app = exp();
var cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
app.use([cors(), exp.json()]);

app.use(exp.json());



const saltRounds = 10;
const jwtSecret = 'your_jwt_secret';

app.use(bodyParser.json());

const db = mysql.createConnection({
   host: 'localhost', user: 'root', password: '', port: 3306, database: 'anime_react'
});
db.connect(err => {
   if (err) throw err;
   console.log('Da ket noi database')
});
// nơi định nghĩa các đường route


// lấy sp mới 
app.get("/spmoi/:sosp?",(req,res)=>{
let sosp = parseInt(req.params.sosp || 6);
if(sosp <= 1) sosp = 6;
   let sql = 'SELECT id, ten_sp, gia, hinh FROM san_pham WHERE an_hien = 1 ORDER BY ngay desc LIMIT 0, ?';
db.query(sql, sosp,(err,data)=>{
   if(err)
      res.json({"thông báo":"không lấy được sản phẩm mới", err})
   else
      res.json(data)
   
})
})
// lấy sp nhiều nhất
app.get("/sp/:id?",(req,res)=>{
   let id = parseInt(req.params.id || 6)
   if(id <= 1) id = 6;
   let sql = `SELECT id, ten_sp,gia,hinh FROM san_pham WHERE an_hien = 1`;
   db.query(sql,id,(err,data)=>{
      if(err) res.json({"thông báo":"lỗi không lấy được sản phẩm phổ biến", err})
         else res.json(data)
   })
})

// lấy sp có số người xem nhiều nhất 
app.get("/spView/:id?",(req,res)=>{
   let id = parseInt(req.params.id || 7)
   if(id <= 1) id = 7
   let sql = "SELECT id, ten_sp, gia, hinh FROM san_pham WHERE an_hien = 1 ORDER BY id desc";
   db.query(sql, id,(err,data)=>{
      if(err) res.json({"thông báo":"không lấy được sản phẩm có view cao",err})
         else res.json(data)
   })
})


/// lấy sản phẩm chi tiết
app.get("/sp_detail/:id",(req,res)=>{
   let id = parseInt(req.params.id || 0)
   if(id <=1) id =0
   let sql = "SELECT id, ten_sp, hinh, mo_ta,ngay ,gia FROM san_pham WHERE id = ?"
   db.query(sql,id,(err,data)=>{
      if(err) res.json({"thông báo":"không lấy được sản phẩm chi tiết",err})
         else res.json(data[0])
   })
})
// API loại
app.get("/loai/:id_loai?",(req,res)=>{
  let id_loai = parseInt(req.params.id_loai ||1);
  if(isNaN(id_loai) || id_loai <= 0) {
    res.json({"thông báo":"khong có tên loại","id_loai":id_loai}); return;
  }
  let sql = "SELECT id, ten_loai FROM loai ";
  db.query(sql,id_loai,(err,data)=>{
    if(err) res.json({"thông báo":"không tìm lấy tên loại",err})
      else res.json(data)
  })
})

// viết API sản phẩm trong loại
app.get("/sptrongloai/:id_loai?",(req,res)=>{
  let id_loai = parseInt(req.params.id_loai || 1)
  if(isNaN(id_loai) || id_loai <= 0){
    res.json({"thông báo":"không tìm thấy sản phẩm trong loại","id_loai":id_loai}); return;
  }
  let sql = "SELECT id, ten_sp, gia, mo_ta, hinh, id_loai FROM san_pham WHERE an_hien = 1 AND id_loai = ?";
  db.query(sql, id_loai,(err,data)=>{
    if(err) res.json({"thông báo":"lỗi không thấy sản phẩm thuộc loại",err});
    else res.json(data)
  })
})


// Viết API lấy Bình Luận
app.get("/comments",(req,res)=>{
  let sql = "SELECT * FROM comments";
  db.query(sql,(err,data)=>{
    if(err){res.json({"thông báo":"không thể hiện được bình luận",err}); return;}
    else {res.json(data)}
  })
})
// render Bình luận
app.post("/comments",(req,res)=>{
  let{ noi_dung } = req.body;
  let sql = "INSERT INTO comments (noi_dung) VALUES (?)"
  db.query(sql,[noi_dung],(err,result)=>{
    if(err){
      res.json({"thông báo":"không thêm được bình luận",err});
    }else{
      res.json({"thông báo":"thêm bình luận","id":result.insertId});
    }
  })
})

// Đăng nhập API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.status(400).json({ msg: 'User does not exist' });
    }

    const user = result[0];

    if (password !== user.password) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    jwt.sign(
      { id: user.id, role: user.role },
      'your_jwt_secret',
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  });
});


// Đăng ký API
// Đăng ký API
app.post('/api/register', (req, res) => {
  const { name, email, phone, address, password } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' });
  }

  // Mã hóa mật khẩu trước khi lưu
  

  // Thêm người dùng vào cơ sở dữ liệu
  const sql = 'INSERT INTO users (name, email, phone, address, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
  db.query(sql, [name, email, phone, address, password], (err, result) => {
      if (err) {
          console.error('Lỗi khi thêm người dùng:', err);
          return res.status(500).json({ msg: 'Lỗi khi thêm người dùng' });
      }
      res.status(201).json({ id: result.insertId, name, email, phone, address });
  });
});

// tạo api tìm kiếm
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  const sql = `SELECT id, ten_sp, hinh, slug   FROM san_pham WHERE ten_sp LIKE ?`;
  db.query(sql, [`%${searchTerm}%`], (err, results) => {
      if (err) throw err;
      res.json(results);
  });
});


// ------------------------==================- Node server Admin==========================================================================================

//Lấy danh sách sản phẩm 
app.get("/admin/sp",(req,res)=>{
  let sql = 'SELECT id, ten_sp, gia, hinh, ngay FROM san_pham ORDER BY id desc'
  db.query(sql,(err,data)=>{
    if(err){
     res.json({"thông báo":"không có sản phẩm nào",err})
    }else{
      res.json(data)
    }
  })
})



//Lấy chi tiết 1 sản phẩm
// Lấy thông tin sản phẩm theo id
app.get('/admin/sp/:id', (req, res) => {
   let id = parseInt(req.params.id);
   if (id <= 0) {
     res.json({ "thongbao": "Sản phẩm không có trong danh sách", "id": id });
     return;
   }
   let sql = 'SELECT * FROM san_pham WHERE id = ?';
   db.query(sql, id, (err, data) => {
     if (err) {
       res.json({ "thongbao": "Lỗi lấy hiện thông tin sản phẩm!", err });
     } else {
       res.json(data[0] || { "thongbao": "Không tìm thấy sản phẩm", "id": id });
     }
   });
 });


 // Thêm mới sản phẩm
app.post('/admin/sp', (req, res) => {
  let data = req.body;
  let sql = 'INSERT INTO san_pham SET ?';
  db.query(sql, data, (err, result) => {
      if (err) {
          res.status(500).json({ "thongbao": "Lỗi thêm sản phẩm!", err });
      } else {
          res.status(200).json({ "thongbao": "Đã thêm thành công sản phẩm", "id": result.insertId });
      }
  });
});


 


 // Cập nhật một sản phẩm
 app.put('/admin/sp/:id', (req, res) => {
  let data = req.body;
  let id = parseInt(req.params.id);

  // Kiểm tra ID có hợp lệ không
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ "thongbao": "ID sản phẩm không hợp lệ", "id": id });
    return;
  }

  // Câu lệnh SQL để cập nhật sản phẩm
  let sql = 'UPDATE san_pham SET ? WHERE id = ?';
  
  // Chạy câu lệnh SQL
  db.query(sql, [data, id], (err, result) => {
    if (err) {
      // Trả về lỗi nếu cập nhật không thành công
      res.status(500).json({ "thongbao": "Không cập nhật được sản phẩm", "error": err });
    } else if (result.affectedRows === 0) {
      // Kiểm tra nếu không có hàng nào bị cập nhật (sai ID)
      res.status(404).json({ "thongbao": "Không tìm thấy sản phẩm với ID này", "id": id });
    } else {
      // Thành công
      res.json({ "thongbao": "Sản phẩm đã được cập nhật", "affectedRows": result.affectedRows });
    }
  });
});

 
 // Xóa sản phẩm
 app.delete('/admin/sp/:id', (req, res) => {
   let id = parseInt(req.params.id);
   if (isNaN(id) || id <= 0) {
     res.json({ "thongbao": "ID sản phẩm không hợp lệ", "id": id }); return;

   }
   let sql = 'DELETE FROM san_pham WHERE id = ?';
   db.query(sql, id, (err, result) => {
     if (err) {
       res.json({ "thongbao": "Không xóa được sản phẩm", err });
     } else {
       res.json({ "thongbao": "Đã xóa sản phẩm!", "affectedRows": result.affectedRows });
     }
   });
 });


 // viết API quảng lí user 
   



app.listen(3000, () => console.log(`Ung dung dang chay voi port 3000`));
