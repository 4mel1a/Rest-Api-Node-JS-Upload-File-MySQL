const express = require("express")
const app = express()
const multer = require("multer") // untuk upload file
const path = require("path") // untuk memanggil path direktori
const fs = require("fs") // untuk manajemen file
const mysql = require("mysql")
const cors = require("cors")
const moment = require("moment")

app.use(express.static(__dirname));
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // set file storage
        cb(null, './image');
    },
    filename: (req, file, cb) => {
        cb(null, "image-"+ Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage: storage})

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "olshop"
})

// endpoint untuk menambah data barang baru
app.post("/barang", upload.single("image"), (req, res) => {
    
    //prepare data
    let data = {
        nama_barang: req.body.nama_barang,
        harga: req.body.harga,
        stok: req.body.stok,
        deskripsi: req.body.deskripsi,
        image: req.file.filename
    }

    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        // create sql insert
        let sql = "insert into barang set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})

// endpoint untuk mengubah data barang
app.post("/barang/update", upload.single("image"), (req, res) => {
    let data = null, sql = null
    // parameter perubahan data
    let param = { kode_barang: req.body.kode_barang}

    if (!req.file) {
        // jika tidak ada file yang dikirim = update data saja
        data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi
        }
    } else {
        // jika mengirim file = update data + reupload
        data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi,
            image: req.file.filename
        }

        // get data yang akan diupdate untuk mendapatkan nama file yang lama
        sql = "select * from barang where ?"
        //run query
        db.query(sql, param, (err, result) => {
            if (err) throw err
            //tampung nama file yang lama
            let fileName = result[0].image

            //hapus file yang lama
            let dir = path.join(__dirname, "image", fileName)
            fs.unlink(dir, (error) => {})
        })
    }

    // create sql update
    sql = "update barang set ? where ?"

    //run sql update
    db.query(sql, [data, param], (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        }
    })
})

// endpoint untuk menghapus data barang
app.delete("/barang/:kode_barang", (req, res) => {
    let param = {kode_barang: req.params.kode_barang}

    //ambil data yang akan dihapus
    let sql = "select * from barang where ?"
    //run query
    db.query(sql, param, (error, result) => {
        if (error) throw error
        
        //tampung nama file yang lama
        let fileName = result[0].image

        //hapus file yang lama
        let dir = path.join(__dirname, "image", fileName)
        fs.unlink(dir, (error) => {})
    })

    //create sql delete
    sql = "delete from barang where ?"
    //run query
    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }
    })
})

// endpoint ambil data barang
app.get("/barang", (req, res) => {
    //create sql query
    let sql = "select * from barang"

    //run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})

// end-point menyimpan data admin dg method POST
app.post("/admin", (req, res) => {
    //prepare data
    let data = {
        nama_admin: req.body.nama_admin,
        username: req.body.username,
        password: req.body.password
    }
    
    //create sql query insert
    let sql = "insert into admin set ?"

    //run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error){
            response = {
                message: error.message //pesan error
            }
        }else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) //send response
    })
})

// end-point mengubah data admin dg method PUT
app.put("/admin", (req, res) => {
    // prepare data
    let data = [
        // data
        {
            nama_admin: req.body.nama_admin,
            username: req.body.username,
            password: req.body.password
        },
        // parameter (primary key)
        {
        id_admin: req.body.id_admin
        }
    ]

    // create sql query update
    let sql = "update admin set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if(error) {
            response = {
                message: error.message
            }
        }else {
            response = {
                message: result.affectedRows + " data update"
            }
        }
        res.json(response) //send response
    })
})

// end-point akses data admin dg method GET
app.get("/admin", (req, res) => {
    //create sql query
    let sql = "select * from admin"

    //run query
    db.query(sql, (error, result) => {
        let response = null
        if(error) {
            response = {
                message: "error.message" //pesan error
            }
        }else {
            response = {
                count: result.length, //jumlah data
                admin: result //isi data
            }
        }
        res.json(response) //send response
    })
})

// end-point akses data admin berdasarkan id_admin tertentu dg method GET
app.get("/admin/:id", (req, res) => {
    let data = {
        id_admin: req.params.id
    }
    //create sql query
    let sql = "select * from admin where ?"

    //run query
    db.query(sql, data, (error, result) => {
        let response = null
        if(error){
            response = {
                message: error.message //pesan eror
            }
        }else {
            response = {
                count: result.length, //jumlah data
                admin: result //isi data
            }
        }
        res.json(response) //send response
    })
})

// end-point menghapus data admin berdasarkan id_admin dg method DELETE
app.delete("/admin/:id", (req, res) => {
    //prepare data
    let data = {
        id_admin: req.params.id
    }
    //create query sql delete
    let sql = "delete from admin where ?"

    //run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        }else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) //send response
    })
})

// endpoint untuk menambah data users baru
app.post("/users", upload.single("image"), (req, res) => {
    
    //prepare data
    let data = {
        nama_users: req.body.nama_users,
        alamat: req.body.alamat,
        image: req.file.filename,
        username: req.body.username,
        password: req.body.password
    }

    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        // create sql insert
        let sql = "insert into users set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})

// endpoint untuk mengubah data users
app.put("/users/update", upload.single("image"), (req, res) => {
    let data = null, sql = null
    // parameter perubahan data
    let param = { id_users: req.body.id_users}

    if (!req.file) {
        // jika tidak ada file yang dikirim = update data saja
        data = {
            nama_users: req.body.nama_users,
            alamat: req.body.alamat,
            username: req.body.username,
            password: req.body.password
        }
    } else {
        // jika mengirim file = update data + reupload
        data = {
            nama_users: req.body.nama_users,
            alamat: req.body.alamat,
            image: req.file.filename,
            username: req.body.username,
            password: req.body.password
        }

        // get data yang akan diupdate untuk mendapatkan nama file yang lama
        sql = "select * from users where ?"
        //run query
        db.query(sql, param, (err, result) => {
            if (err) throw err
            //tampung nama file yang lama
            let fileName = result[0].image

            //hapus file yang lama
            let dir = path.join(__dirname, "image", fileName)
            fs.unlink(dir, (error) => {})
        })
    }

    // create sql update
    sql = "update users set ? where ?"

    //run sql update
    db.query(sql, [data, param], (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil diubah"
            })
        }
    })
})

// endpoint untuk menghapus data users
app.delete("/users/:id_users", (req, res) => {
    let param = {id_users: req.params.id_users}

    //ambil data yang akan dihapus
    let sql = "select * from users where ?"
    //run query
    db.query(sql, param, (error, result) => {
        if (error) throw error
        
        //tampung nama file yang lama
        let fileName = result[0].image

        //hapus file yang lama
        let dir = path.join(__dirname, "image", fileName)
        fs.unlink(dir, (error) => {})
    })

    //create sql delete
    sql = "delete from users where ?"
    //run query
    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({
                message: error.message
            })
        } else {
            res.json({
                message: result.affectedRows + " data berhasil dihapus"
            })
        }
    })
})

// endpoint ambil data users
app.get("/users", (req, res) => {
    //create sql query
    let sql = "select * from users"

    //run query
    db.query(sql, (error, result) => {
        if (error) throw error
        res.json({
            data: result,
            count: result.length
        })
    })
})

// end-point menambahkan data transaksi dg method POST
app.post("/transaksi", (req, res) => {
    //prepare data to transaksi
    let data = {
        id_users: req.body.id_users,
        tgl_transaksi: req.body.tgl_transaksi,
        // kode_barang: req.body.kode_barang,
        // jumlah: req.body.jumlah,
        // harga_beli: req.body.harga_beli
    }
    //parse to JSON
    let transaksi = JSON.parse(req.body.transaksi)

     //create query insert to transaksi
     let sql = "insert into transaksi set ?"

     //run query
     db.query(sql, data, (error, result) => {
         let response = null
         if (error) {
             res.json({message: error.message})
         } else {
             // get last inserted kode_transaksi
             let lastID = result.insertId

             //prepare data to detail_transaksi
             let data = []
             for (let index = 0; index < transaksi.length; index++) {
                 data.push([
                     lastID, transaksi[index].kode_barang, transaksi[index].jumlah, transaksi[index].harga_beli
                 ])
             }

             //create query insert detail_transaksi
             let sql = "insert into detail_transaksi values ?"

             db.query(sql, [data], (error, result) => {
                 if (error){
                     res.json({message: error.message})
                 }else {
                     res.json({message: "Data has been inserted"})
                 }
             })
         }
     })
})

// end-point menampilkan data transaksi dg method GET
app.get("/transaksi", (req, res) => {
    // create sql query
    let sql = "select t.kode_transaksi, t.tgl_transaksi, u.id_users, u.nama_users " + 
    "from transaksi t join users u on u.id_users = t.id_users "

    //run query
    db.query(sql, (error, result) => {
        if(error) {
            res.json({message: error.message})
        }else{
            res.json({
                count: result.length,
                transaksi: result
            })
        }
    })
})

// end-point untuk menampilkan detail transaksi dg method GET
app.get("/detail_transaksi/:kode_transaksi", (req, res) => {
    let param = [ req.params.kode_transaksi]

    //create sql query
    let sql = "select t.tgl_transaksi, b.nama_barang, dt.jumlah, dt.harga_beli " +
     "from detail_transaksi dt join transaksi t on t.kode_transaksi = dt.kode_transaksi " + 
     "join barang b on b.kode_barang = dt.kode_barang " + "where t.kode_transaksi = ?"

    db.query(sql, param, (error, result) => {
        if(error) {
            res.json({message: error.message})
        }else {
            res.json({
                count: result.length,
                detail_transaksi: result
            })
        }
    })
})

//end-point untuk menghapus data transaksi
app.delete("/transaksi/:kode_transaksi", (req, res) => {
    let param = { kode_transaksi: req.params.kode_transaksi}

    //create sql query delete detail_transaksi
    let sql = "delete from detail_transaksi where ?"

    db.query(sql, param, (error, result) => {
        if(error) {
            res.json({message: error.message})
        }else {
            let param = { kode_transaksi: req.params.kode_transaksi}

            //create sql query delete pelanggaran_siswa
            let sql = "delete from transaksi where ?"

            db.query(sql, param, (error, result) => {
                if(error) {
                    res.json({message: error.message})
                }else {
                    res.json({message: "Data has been deleted"})
                }
            })
        }
    })
})

// port untuk server
app.listen(8000, () => {
    console.log("Server run on port 80000");
})
