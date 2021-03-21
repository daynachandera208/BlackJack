import { Room, Client, generateId } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import { verifyToken, User, IUser } from "@colyseus/social";
import { DeckOfCards } from "../DataStructures/DeckOfCards";
import { DelarData } from "../DataStructures/DelarData";
import { GameTable } from "../DataStructures/GameTable";
import { PlayCard } from "../DataStructures/PlayCard";
import { Player } from "../DataStructures/Player";
import { PlayerHandData } from "../DataStructures/PlayerHandData";
import { State } from "../DataStructures/State";

import {GameRoom} from "./GameRoom";
export class Table1 extends GameRoom 
{ 
    SetTable(){
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
{ SetTable(){
    this.state.currentTable=new GameTable();
    this.state.currentTable.minBet=100;
    this.state.currentTable.maxBet=50000;
    this.state.currentTable.handsLimit=3;
    this.state.currentTable.entryFees=10;
    this.state.currentTable.tableName="Toureny";
    console.log('Table2 Created');

    }
}
export class Table3 extends GameRoom 
{ 
    SetTable(){
        this.state.currentTable=new GameTable();
        this.state.currentTable.minBet=1000;
        this.state.currentTable.maxBet=500000;
        this.state.currentTable.handsLimit=3;
        this.state.currentTable.entryFees=15;
        this.state.currentTable.tableName="casinos";
        console.log('Table3 Created');

    }
}
