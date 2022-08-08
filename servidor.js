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
        //console.log(resultado.rows);
        let response=resultado.rows;
        //console.log(response);
        res.send(JSON.stringify(response));
    }catch(err){
        console.log(`Error al ejecutar consulta: ${err.message}`);//"Error al ejecutar consulta:" +err.message
        res.status(500);
        res.end('error al buscar datos');
    }
});
//Reciibe los datos de un nuevo usuario y los almacena en postgress

app.post('/usuario',async (req,res)=>{
    //console.log(req.body);
    let nombre=req.body.nombre;
    let balance=req.body.balance;
    //console.log("el nuevo usuario es:"+nombre);
    //console.log("el nuevo balance es:"+balance);
    //query para buscar el id maximo
    const queryIDUsuario='SELECT COALESCE(MAX("id"),0)+1 AS "id" FROM "usuarios"'
    
    //ejecucion querys
    const respuestaIdUsuario=await pool.query(queryIDUsuario);
    
    //verificacion de datos
    //console.log(respuestaIdUsuario.rows[0].id);
    
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
    //aqui viene el codigo para actualizar los usuarios
});
//Recibe el id de un usuario rregistradio y lo elimina
app.use(bodyParser.urlencoded({extended: false}));
app.delete("/usuario/:id",async (req,res)=>{
    const consulta='DELETE FROM "usuarios" WHERE "id"=$1';
    try {
        console.log("El id del usuario a borroa es el:"+req.params.id);
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
//app.use(bodyParser.urlencoded({extended: false}));
app.post('/transferencia',async (req,res)=>{
    const consulta='SELECT * FROM "usuarios" WHERE "id"=$1';
    const updateNuevoBalance='UPDATE public.usuarios SET balance=$1 WHERE id=$2;'
    const updateNuevoBalanceReceptor='UPDATE public.usuarios SET balance=balance + $1 WHERE id=$2;';
    const ultimoId='select max(id) from public.transferencias;';
    const insertTransferencia='INSERT INTO public.transferencias(id, emisor, receptor, monto, fecha) VALUES ($1, $2, $3, $4, $5);'
    let resultadoEmisor;
    //res.send("Se Ha solicitado una transferencia");
    console.log("Este es el req que envia el formulñario transferencia : "+req.body.emisor);
    try {
        resultadoEmisor=await pool.query(consulta,[req.body.emisor]);
        console.log("----------------------------------------------------------------------");
        console.log(resultadoEmisor.rows);
        let response=resultadoEmisor.rows;
        console.log("El Banace solicitado es  : "+response[0].balance);
        if(parseInt(req.body.monto) > parseInt(response[0].balance)){
            res.json({respuesta :"Error: El momto a transferir es mayor al saldo en caja"});
        }else{
            //res.json({status:"OK",body:"Esta respuesta esta e el body"});
            res.json({respuesta :"El monto solicitado esta correcto"});
            let nuevoSaldo=parseInt(response[0].balance)-parseInt(req.body.monto);
            try {
                //descuento al saldo del emisor en la transferencia
                resultadoUpdateUsuario=await pool.query(updateNuevoBalance,[nuevoSaldo,req.body.emisor]);
                console.log("La actualicion del saldo del usuario emisor termino con exito");
                //se el suma al recepor el valor del monto de la transferencia
                resultadoUpdateUsuario=await pool.query(updateNuevoBalanceReceptor,[parseInt(req.body.monto),req.body.receptor]);
                console.log("La actualicion del saldo del usuario receptor termino con exito");
                //se inserta la transferencia a la tabla de transferencias
                ultimoIdint=await pool.query(ultimoId);
                console.log("El ultimo Id es:"+ultimoIdint.rows[0].max);
                insertarTransferenciaInt=await pool.query(insertTransferencia,[parseInt(ultimoIdint.rows[0].max)+1,req.body.emisor,req.body.receptor,req.body.monto,new Date(Date.now())]);
                console.log("Se inserto la nueva transfrenecia con exito");
            } catch (error) {
                console.log(`Error al ejecutar actualizacion de saldo: ${error.message}`);
            }

        }        
    } catch (error) {
        console.log(`Error al ejecutar consulta de busqueda de Emisor: ${error.message}`);
        //res.status(500);
        //res.end('error al buscar datos');
    }
});
//devuelve todas las transferencias almacenadas
//en la base de datos
//en formato de un arreglo
app.get('/transferencias',async (req,res)=>{
    const consulta='SELECT t.id,t.emisor,u1.nombre AS "nombreEmisor",t.receptor,u2.nombre AS "nombreReceptor",t.monto,t.fecha FROM transferencias t JOIN usuarios u1 ON u1.id=t.emisor JOIN usuarios u2 ON u2.id=t.receptor'
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

//ejecutamos el servidor
app.listen(puerto,function(){
    console.log(chalk.green.inverse("Servidor escuchando en ek puerto:"+puerto));
})