/*

ATENTIE!
inca nu am implementat protectia contra SQL injection
*/

const {Client, Pool} = require("pg");


class AccesBD {
    static #instanta = null; //o singura conexiune
    static #initializat = false; //static - nu tine de obiect, tine de clasa

    constructor() { //initializarea unei clase, Singleton - o singura instanta a acelei clase
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
            //nu am facut initializarile inca si nu pot crea instanta
        }
    }
    
    /*Conexiunea catre baza de date*/
    initLocal() {
        this.client = new Client({ //this ma refer la instanta curenta
            database: "proiect_web",
            user: "lorena",
            password: "lorena",
            host: "localhost",
            port: 5432
        });
        this.client.connect();
    }

    /**/

    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     *
     * /

     /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} un obiect cu datele pentru query
     * @returns {AccesBD}
     */
    static getInstanta({init = "local"} = {}) { //init:site
        console.log(this);//this-ul e clasa! nu instanta pt ca metoda statica
        if (!this.#instanta) {
            this.#initializat = true; //daca exista instanta o returneaza, altfel creaza alta noua. #instanta incepe fiind setat false
            this.#instanta = new AccesBD();

            //initializarea poate arunca erori
            //vom adauga aici cazurile de initializare 
            //pentru baza de date cu care vrem sa lucram
            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal(); //creez conexiunea la baza de date
                }


                //daca ajunge aici inseamna ca nu s-a produs eroare la initializare

            } catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }

        }
        return this.#instanta;
    }


    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditii - lista de stringuri cu conditii pentru where
     */

    /*Adăugați în funcțiile select, update și delete, posibilitatea de a avea operatorul logic "or" între condiții.*/

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    select({tabel = "", campuri = [], conditii = [[]]} = {}, callback, parametriQuery = []){ //selecteaza tabelul si campurile=coloanele
        let conditieWhere = "";
        if(conditii.length > 0 && conditii[0].length > 0){
            for(let i = 0; i < conditii.length; i++){
                conditii[i] = "(" + conditii[i].join(" and ") + ")";
            }
            conditieWhere = `where ${conditii.join(" or ")}`;
        }

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`; //adauga $ in fata fiecarui camp si face o inlocuire a caracterelor speciale
        console.log(comanda);
        //comanda="select id, camp1, camp2, from tabel (where camp1=$1 si camp2=$2") = conditii where
        this.client.query(comanda, parametriQuery, callback); //apoi introduce si un query de tipul [val1, val2]-parametri Query si apoi callback-ul pt query
    }


  async selectAsync({tabel = "", campuri = [], conditii = [[]]} = {}){
        let conditieWhere = "";
        if(conditii.length > 0 && conditii[0].length > 0){
            for(let i = 0; i < conditii.length; i++){
                conditii[i] = "(" + conditii[i].join(" and ") + ")";
            }
            conditieWhere = `where ${conditii.join(" or ")}`;
        }

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda);
        try{
            let rez = await this.client.query(comanda);
            return rez;
        } catch (e){
            console.log(e);
            return null;
        }
    }

    insert({tabel = "", campuri = {}} = {}, callback) {
        console.log("-------------------------------------------")
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values ( ${Object.values(campuri).map((x) => `'${x}'`).join(",")})`; //toate valorile si pun apostrof in stg si dreapta.
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */
    // update({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    //     if(campuri.length!=valori.length)
    //         throw new Error("Numarul de campuri difera de nr de valori")
    //     let campuriActualizate=[];
    //     for(let i=0;i<campuri.length;i++)
    //         campuriActualizate.push(`${campuri[i]}='${valori[i]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     console.log(comanda);
    //     this.client.query(comanda,callback)
    // }

    update({tabel = "", campuri = {}, conditiiAnd = []} = {}, callback, parametriQuery) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    updateParametrizat({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
        if(campuri.length!=valori.length)
            throw new Error("Numarul de campuri difera de nr de valori")
        let campuriActualizate=[];
        for(let i=0;i<campuri.length;i++)
            campuriActualizate.push(`${campuri[i]}=$${i+1}`);
        let conditieWhere="";
        if(conditiiAnd.length>0)
            conditieWhere=`where ${conditiiAnd.join(" and ")}`;
        let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111",comanda);
        this.client.query(comanda,valori, callback)
    }


    //TO DO
    // updateParametrizat({tabel="",campuri={}, conditiiAnd=[]} = {}, callback, parametriQuery){
    //     let campuriActualizate=[];
    //     for(let prop in campuri)
    //         campuriActualizate.push(`${prop}='${campuri[prop]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     this.client.query(comanda,valori, callback)
    // }

    delete({tabel = "", conditiiAnd = []} = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    query(comanda, callback) {
        this.client.query(comanda, callback);
    }

}

module.exports = AccesBD;