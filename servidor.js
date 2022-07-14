const {Pool} = require("pg");
require('dotenv').config();

//2.- crear la configuracion
const configuracion={
    user: process.env.PGUSER,
    host:process.env.PGHOST,
    database:process.env.PGDATABASE,
    password:process.env.PGPASSWORD
}
const pool=new Pool(configuracion);
const { response } = require('express');
const chalk=require('chalk');
var express = require('express');
var bodyParser=require('body-parser');
const app=express();
const puerto=3000;
//hacemos por defecto la carpeta public
app.use(express.static('public'));
//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//oinicializamos el servdor
//para la ruta principal
app.get('/',(req,res)=>{
    res.send("HOla mundo");
});
//devuelve todos los usuarios registradops con sus balances
app.get('/usuarios',async (req,res)=>{
    const consulta='SELECT * FROM "usuarios"'
    let resultado;
    try{
        resultado= await pool.query(consulta);
        console.log(resultado.rows);
        let response=resultado.rows;
        console.log(response);
        res.send(JSON.stringify(response));
    }catch(err){
        console.log(`Error al ejecutar consulta: ${err.message}`);//"Error al ejecutar consulta:" +err.message
        res.status(500);
        res.end('error al buscar datos');
    }
});
//Reciibe los datos de un nuevo usuario y los almacena en postgress

app.post('/usuario',async (req,res)=>{
    console.log(req.body);
    let nombre=req.body.nombre;
    let balance=req.body.balance;
    console.log("el nuevo usuario es:"+nombre);
    console.log("el nuevo balance es:"+balance);
    //query para buscar el id maximo
    const queryIDUsuario='SELECT COALESCE(MAX("id"),0)+1 AS "id" FROM "usuarios"'
    
    //ejecucion querys
    const respuestaIdUsuario=await pool.query(queryIDUsuario);
    
    //verificacion de datos
    console.log(respuestaIdUsuario.rows[0].id);
    
    //console.log(req.body);
    //query para insertar datos
    const query1='INSERT INTO "usuarios" VALUES ($1,$2,$3)';
    
    //ejecucion insert
    try {
        
        await pool.query(query1,[respuestaIdUsuario.rows[0].id,nombre,balance]);
        
        
        res.send("Datos ingresados correctamente");
    } catch (error) {
        await pool.query("ROLLBACK");
        console.log("Error al ejecutar consultas");
        console.log("Error:"  + error.message);
        res.send("error al ingresar los datos");
    }

    //res.send("HOla mundo");
});
//trcibe los datos modificados de un usuario y los actualiza
app.put('/usuario',(req,res)=>{
    res.send("HOla mundo");
});
//Recibe el id de un usuario rregistradio y lo elimina
app.delete('/usuario',async (req,res)=>{
    const consulta='DELETE FROM "usuarios" WHERE "id"=$1';
    try {
        console.log("El id del usuario a borroa es el:"+req.params);
        await pool.query(consulta,[req.params.id]);
        res.json({status:"OK"});
    } catch (error) {
        console.log("error en la consulta");
        console.log("Error:"+error.message);
        res.status(500);
        res.json({memsaje:"Error al eliminar"});
    }
});
//recibe los datos para realizar una transaccion 
app.post('/tranferencia',(req,res)=>{
    res.send("Se Ha solicitado una transferencia");
});
//devuelve todas las transferencias almacenadas
//en la base de datos
//en formato de un arreglo
app.get('/transferencias',(req,res)=>{
    res.send("Estas son todas las tranferencias");
});

//ejecutamos el servidor
app.listen(puerto,function(){
    console.log(chalk.green.inverse("Servidor escuchando en ek puerto:"+puerto));
})