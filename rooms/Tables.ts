import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import { verifyToken, User, IUser } from "@colyseus/social";
import { DeckOfCards } from "../Utils/DeckOfCards";
import { DelarData } from "../States/DelarData";
import { GameTable } from "../States/GameTable";
import { PlayCard } from "../States/PlayCard";
import { Player } from "../States/Player";
import { PlayerHandData } from "../States/PlayerHandData";
import { State } from "../States/State";
import {GameRoom} from "../Utils/GameRoom";

//this are clasees for creating differnet Table wise Game Rooms
//Set Here values for table creation in game; table 1,2,3 respectiely for play, casinos , tourny tables. 


export class Table1 extends GameRoom 
{ 
    SetTable()
    {
        this.state.currentTable=new GameTable();
        this.state.currentTable.minBet=10;
        this.state.currentTable.maxBet=5000;
        this.state.currentTable.handsLimit=3;
        this.state.currentTable.entryFees=5;
        this.state.currentTable.tableName="Play";
        console.log('Table1 Created');
    }
}


export class Table2 extends GameRoom 
{ 
        SetTable()
        {
            this.state.currentTable=new GameTable();
            this.state.currentTable.minBet=100;
            this.state.currentTable.maxBet=50000;
            this.state.currentTable.handsLimit=5;
            this.state.currentTable.entryFees=10;
            this.state.currentTable.tableName="Toureny";
            console.log('Table2 Created');

        }
}


export class Table3 extends GameRoom 
{ 
    SetTable()
    {
        this.state.currentTable=new GameTable();
        this.state.currentTable.minBet=1000;
        this.state.currentTable.maxBet=500000;
        this.state.currentTable.handsLimit=7;
        this.state.currentTable.entryFees=15;
        this.state.currentTable.tableName="casinos";
        console.log('Table3 Created');

    }
}
