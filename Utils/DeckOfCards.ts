import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayCard,CardsType} from "../States/PlayCard"
//Class used to manage Cards for all players and delars
export class DeckOfCards extends Schema
{
    @type([PlayCard]) 
    cardsOfDeck:ArraySchema<PlayCard>;//array of all available cards 

    @type('int32')
    deckLength:number;//total numbers of cards in array at runtime
  
    @type('int32')
    counter:number;//used to distribute same cars for testing splits


    public CopyCard(cD:ArraySchema<PlayCard>)// method used to copy pre-Instansiated cards from other object into current object
    {
        this.deckLength=52;  
        //console.log("-- copycard- --"+cD.length);
  
        this.counter=0;
        this.cardsOfDeck=new ArraySchema<PlayCard>();
        this.cardsOfDeck.clear();
        //this.cardsOfDeck=cD; don't use this it will copy by instance  not by values use following for values
        cD.forEach(e=>{
        //   console.log(e);
            this.cardsOfDeck.push(e);
        });
        // console.log("copy gets this");
        /* this.cardsOfDeck.forEach(e=>{
                console.log(e);
            });  */
        //console.log(cD.at(0).cardValue+" ++ "+this.cardsOfDeck.at(0).cardValue);
    }

    public  SuffleDeck()//Method to initialize all cards to object'a array-schema used for first time and than copied the cards from it's object to actual object
    {
        //console.log("-- suffledeck-");
        this.deckLength=52;
        this.cardsOfDeck=new ArraySchema<PlayCard>();
        this.cardsOfDeck.clear();
        
        for( const i in CardsType)
        { 
            if(isNaN(Number(CardsType[i])))
            {
                for(let j:number=1;j<14;j++)
                {
                    
                    let c:PlayCard;
                    c=new PlayCard();
                    c.cardType=CardsType[CardsType[i]];
                    c.cardValue=j;
                    if(j>1 && j<10)
                    c.cardPoint=j;
                    else if(j==1)
                    c.cardPoint=11;
                    else
                    c.cardPoint=10;
                    this.cardsOfDeck.push(c);
                
                }
            }
        }  
        //console.log("---"+this.cardsOfDeck.at(13).cardValue);
        /*  this.cardsOfDeck.forEach(e=>{
                console.log(e);
            });   */
    }
    public GetRandomCardForDelar(currentPoints:number=0,opponentsMinPoints:number=0,opponentsMaxPoints:number=0)// method that handles delars cards distribution as it goes higher from opponentsMinPoints and lower from opponentsMaxPoints
    {
        let c:PlayCard;
        c=new PlayCard();
        
        if(currentPoints==0 ){
            let index:number;
        index= Math.floor(Math.random() * (this.deckLength-1 - 0 + 1)) + 0;
        
            c=this.cardsOfDeck.at(index);
        // c=this.GetCard(11,11);
            this.RemoveCard(index);
            return c;
        }
        if(currentPoints>opponentsMinPoints)
        {
            opponentsMinPoints=currentPoints;
        }
        opponentsMinPoints-=currentPoints;
        if(opponentsMinPoints<=0)
        opponentsMinPoints=1;
        opponentsMaxPoints-=currentPoints;
        if(opponentsMaxPoints<=0 )
        opponentsMaxPoints=1;
        
        if(opponentsMaxPoints>12){
            opponentsMaxPoints=12;
        }
        if(opponentsMinPoints>10  ){
            opponentsMinPoints=8;
            opponentsMaxPoints=12;
        }
        if(opponentsMinPoints>opponentsMaxPoints){
            opponentsMaxPoints=12;
            opponentsMinPoints=7;
        }
    
        //console.log("--"+(opponentsMinPoints+1)+" /// "+ (opponentsMaxPoints-1));
        return this.GetCard(opponentsMinPoints+1, opponentsMaxPoints-1);
        

    }
    public GetRandomCard(winProbability:Boolean=true,currentPoints:number=0,opponentPoints:number=0)
    {
        //currentPoints = points of Current player whoes card is being fetched
        //opponentPoints = points of Delar or opponent pklayer which is max  
        let c:PlayCard;
        c=new PlayCard();
        /*if(this.counter<6) // remove this comment section for testing splits 
        {
            this.counter++;
            c=this.cardsOfDeck.at(10);
            return c;
        }
        
        else{*/

        if(currentPoints==0 && opponentPoints==0)//if initial first cards than get random cards
        {
            let index:number;
            index= Math.floor(Math.random() * (this.deckLength-1  + 1));
            c=this.cardsOfDeck.at(index);
            this.RemoveCard(index);
            return c;
        }
        else if(winProbability)//Logic for distribution of cards such current player win as winprobability is true
        {
            if (currentPoints < opponentPoints)//distribute card having more value than opponent's cards
            {
                    let tmp:number = (opponentPoints - currentPoints) + 1;
                    if (tmp >= 11)
                        return this.GetCard(11, 11);
                    else if (tmp < 10)
                    {
                        if (currentPoints + 11 <= 21)
                            return this.GetCard(tmp, 11);

                        else if ((21 - currentPoints) > tmp )
                            return this.GetCard(tmp, (21 - currentPoints));

                        else
                            return this.GetCard(tmp,tmp);

                    }
                    else
                        return this.GetCard(tmp, tmp);
            }
            else
            {
                    if (currentPoints + 10 <= 21)
                    {
                        return this.GetCard(2, 10);
                    }
                    else
                        return this.GetCard(2, (21 - currentPoints));

            }
        }
        else// distribute cards such that player will loss or burst
        {
            if (currentPoints > 11)
            { //on hit sending burst card
                return this.GetCard(10, 10);
            }
            else 
            {
                if(16-currentPoints<11)//sending cards so that total will never  excid 16
                return this.GetCard(2, (16-currentPoints));
                else
                    return this.GetCard(2, 10);
            }
    //  } // remove this comment also for testing split card functionality
        }
    }
    public GetCard(min:number,max:number)//Method that returns random cards between min and max poin range and also remove it from current cards of array
    {

        let cards:ArraySchema<PlayCard> =new ArraySchema<PlayCard>();//to store all possible cards that are of same point
        let point:number = Math.floor(Math.random() * (max - min + 1)) + min;
        let cardsCount:number=0;//used to track counts of cards

        //console.log("Card "+point); //part of handling dynamic cardspoint when no cards satisfies required points
        //while (cardsCount == 0)
        // {
        this.cardsOfDeck.forEach ( c =>
        {
            if (c.cardPoint == point)
            {
                cards.push(c);
                cardsCount++;
            }
        });

        if (cardsCount == 0 )//if card not found than return random cards
        { 
                let c:PlayCard=new PlayCard();
                let index:number;
                index= Math.floor(Math.random() * (this.deckLength-1  + 1));
                c=this.cardsOfDeck.at(index);
                this.RemoveCard(index);
                return c;
                //console.log("locho");
                //this logic is going into infinite some times so replacing it with ramndom card
                /* let oldpoint:number = point;
                
                point = Math.floor(Math.random() * (max - min + 1)) + min;
                if (point == oldpoint) {
                    if (point <= max && point > min)
                        point--;
                    else
                        point++;
                    if (min == max)
                    {
                        if (point < 10)
                            point++;
                        else
                            point--;
                    }
                }*/
        }
        //}//part of handling dynamic cardspoint when no cards satisfies required points
        else //distribute random card for given random point
        {
            let index: number = 0;
            index = Math.floor(Math.random() * ((cardsCount - 1) - 0 + 1)) + 0;
            // index= this.cardsOfDeck.indexOf(cards[index]);
            let ind: number = 0;
            ind = this.cardsOfDeck.indexOf(cards.at(index));
            let c1: PlayCard;
            c1 = new PlayCard();
            c1 = this.cardsOfDeck.at(ind);
            this.RemoveCard(ind);
            //console.log(c1+" "+index +"  "+cardsCount+" "+ind);
            return c1;
        }
    }
    RemoveCard(index:number)//used to remove card at "index" 'th place of arrayschema of cards to stop duplication of cards while distribution
    {
        this.cardsOfDeck.deleteAt(index);
        this.deckLength--;
    }

}