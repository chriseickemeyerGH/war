import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { cardValue } from "./cardValue";
import { splitDeck } from "./splitDeck";
import { DrawnCard } from "./DrawnCard";
import PlayingCard from "./images/rsz_card.png";
import { WarCards } from "./WarCards";
import firebase from "./firebaseConfig";
import axios from "axios";

const IMG = styled.img`
  height: 100px;
  margin: 5px;
`;
/*
free: company branding, no url changes, no access to analytics, storage limit
paid: remove company branding, unlimited url changes, analytics, storage limit increased
*/

function App() {
  const apiStart = `https://deckofcardsapi.com/api/deck`;
  const [id, setID] = useState("");
  const [cardsLeft, setCardsLeft] = useState({ user: "", cpu: "" });
  const [cardDrawn, setCardDrawn] = useState({ user: "", cpu: "" });

  const [warCardArrays, setWarCardArrays] = useState({ user: [], cpu: [] });
  const [randomVals, setRandomVals] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
    recalculate: false
  });
  const [userDoc, setUserDoc] = useState("");
  const [loggedIn, isLoggedIn] = useState(null);
  const [gameStart, setGameStart] = useState(false);
  const [startAnimation, doStartAnimation] = useState({
    userWon: false,
    cpuWon: false
  });

  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log(user.uid);
        setUserDoc(
          firebase
            .firestore()
            .collection("collection")
            .doc(user.uid)
        );
        isLoggedIn(true);
      } else {
        isLoggedIn(false);
        console.log("not signed in");
      }
    });
  }, []);

  const user_pile = "user_pile";
  const cpu_pile = "cpu_pile";

  const onGameStartTwo = async () => {
    if (gameStart) {
      setWarCardArrays({ user: [], cpu: [] });
      setCardDrawn({ user: "", cpu: "" });
      doStartAnimation({
        userWon: false,
        cpuWon: false
      });
    }
    setGameStart(true);
    if (!loggedIn) {
      firebase
        .auth()
        .signInAnonymously()
        .catch(() => {
          alert(
            "There's been an error. Please refresh the page or try again later."
          );
        });
    }
    try {
      const res = await axios.get(`${apiStart}/new/draw/?count=52`);

      /* draw all cards from new deck */
      let deck_id = res.data.deck_id;
      setID(deck_id);
      let cards = res.data.cards;
      let arr = [];
      cards.map(item => arr.push(item.code));
      let userStartingDeck = splitDeck(arr, 0, 26);
      let cpuStartingDeck = splitDeck(arr, 26, 52);

      /* create two 26 card piles for deck  */
      //inconsistency doing this with Promise.all
      try {
        await axios.get(
          `${apiStart}/${deck_id}/pile/${user_pile}/add/?cards=${userStartingDeck}`
        );
        const res = await axios.get(
          `${apiStart}/${deck_id}/pile/${cpu_pile}/add/?cards=${cpuStartingDeck}`
        );
        //   console.log(res.data);
        let pilesData = res.data.piles;
        setCardsLeft({
          user: pilesData.user_pile.remaining,
          cpu: pilesData.cpu_pile.remaining
        });
      } catch (err) {
        alert(err);
      }
    } catch (err) {
      alert(err);
    }
  };
  //draw from bottom
  const onDrawTwo = async () => {
    try {
      const [userDraw, cpuDraw] = await Promise.all([
        axios.get(`${apiStart}/${id}/pile/${user_pile}/draw/bottom/?count=1`),
        axios.get(`${apiStart}/${id}/pile/${cpu_pile}/draw/bottom/?count=1`)
      ]);

      setTimeout(() => {
        doStartAnimation({ userWon: false, cpuWon: false });
      }, 100);

      let userCards = userDraw.data.cards[0];
      let cpuCards = cpuDraw.data.cards[0];

      setCardsLeft({
        user: userDraw.data.piles.user_pile.remaining,
        cpu: cpuDraw.data.piles.cpu_pile.remaining
      });
      setCardDrawn({
        user: {
          image: userCards.image,
          value: userCards.value,
          suit: userCards.suit
        },
        cpu: {
          image: cpuCards.image,
          value: cpuCards.value,
          suit: cpuCards.suit
        }
      });

      let bothCardCodes = `${userCards.code},${cpuCards.code}`;

      //add to deck

      setTimeout(() => {
        if (cardValue(userCards.value) === cardValue(cpuCards.value)) {
          alert("war");

          const warDraw = async () => {
            try {
              const [userWarDraw, cpuWarDraw] = await Promise.all([
                axios.get(`${apiStart}/${id}/pile/${user_pile}/draw/?count=2`),
                axios.get(`${apiStart}/${id}/pile/${cpu_pile}/draw/?count=2`)
              ]);
              let userFirstCard = userWarDraw.data.cards[0];
              let userSecondCard = userWarDraw.data.cards[1];
              let cpuFirstCard = cpuWarDraw.data.cards[0];
              let cpuSecondCard = cpuWarDraw.data.cards[1];

              let a = Math.random();
              let b = Math.random();
              let c = Math.random();
              let d = Math.random();

              await userDoc.set(
                {
                  userWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: userFirstCard.image,
                      value: userFirstCard.value,
                      suit: userFirstCard.suit,
                      code: userFirstCard.code,
                      face_down: true,
                      id: a
                    },
                    {
                      image: userSecondCard.image,
                      value: userSecondCard.value,
                      suit: userSecondCard.suit,
                      code: userSecondCard.code,
                      id: b
                    }
                  ),
                  cpuWarCards: firebase.firestore.FieldValue.arrayUnion(
                    {
                      image: cpuFirstCard.image,
                      value: cpuFirstCard.value,
                      suit: cpuFirstCard.suit,
                      code: cpuFirstCard.code,
                      face_down: true,
                      id: c
                    },
                    {
                      image: cpuSecondCard.image,
                      value: cpuSecondCard.value,
                      suit: cpuSecondCard.suit,
                      code: cpuSecondCard.code,
                      id: d
                    }
                  )
                },
                { merge: true }
              );
              //compare values of seconds cards

              const doc = await userDoc.get();
              const { cpuWarCards, userWarCards } = doc.data();
              console.log(cpuWarCards, userWarCards);
              setWarCardArrays({ user: userWarCards, cpu: cpuWarCards });
              //    setWarCardArrays({ user: [], cpu: [] });

              let cpuCodesArr = [];
              let userCodesArr = [];
              cpuWarCards.map(item => cpuCodesArr.push(item.code));
              userWarCards.map(item => userCodesArr.push(item.code));
              let cpuCodes = cpuCodesArr.toString();
              let userCodes = userCodesArr.toString();

              let revealCpuCards = cpuWarCards.map(item => ({
                ...item,
                face_down: false
              }));
              let revealUserCards = userWarCards.map(item => ({
                ...item,
                face_down: false
              }));

              setTimeout(() => {
                if (
                  cardValue(userSecondCard.value) ===
                  cardValue(cpuSecondCard.value)
                ) {
                  alert("war again");
                  setRandomVals({
                    ...randomVals,
                    recalculate: !randomVals.recalculate
                  });
                  warDraw();
                } else if (
                  cardValue(userSecondCard.value) >
                  cardValue(cpuSecondCard.value)
                ) {
                  //send cards to user
                  alert("user wins war");

                  setWarCardArrays({
                    user: revealUserCards,
                    cpu: revealCpuCards
                  });
                  const userWin = async () => {
                    try {
                      const res = await axios.get(
                        `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes},${userCodes},${cpuCodes}`
                      );
                      console.log(res.data);
                      setCardsLeft({
                        user: res.data.piles.user_pile.remaining,
                        cpu: cpuWarDraw.data.piles.cpu_pile.remaining
                      });
                      doStartAnimation({ userWon: true, cpuWon: false });
                      userDoc.delete().then(() => console.log("deleted"));
                      setTimeout(() => {
                        setWarCardArrays({ user: [], cpu: [] });
                      }, 310);
                    } catch (err) {
                      alert(err);
                    }
                  };
                  setTimeout(() => {
                    userWin();
                  }, 1000);
                } else if (
                  cardValue(userSecondCard.value) <
                  cardValue(cpuSecondCard.value)
                ) {
                  alert("cpu wins war");
                  //send cards to cpu

                  setWarCardArrays({
                    user: revealUserCards,
                    cpu: revealCpuCards
                  });
                  const cpuWin = async () => {
                    try {
                      const res = await axios.get(
                        `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes},${cpuCodes},${userCodes}`
                      );

                      setCardsLeft({
                        cpu: res.data.piles.cpu_pile.remaining,
                        user: userWarDraw.data.piles.user_pile.remaining
                      });
                      doStartAnimation({ userWon: false, cpuWon: true });

                      userDoc.delete().then(() => console.log("deleted"));
                      setTimeout(() => {
                        setWarCardArrays({ user: [], cpu: [] });
                      }, 310);
                    } catch (err) {
                      alert(err);
                    }
                  };
                  setTimeout(() => {
                    cpuWin();
                  }, 1000);
                }
              }, 2000);
            } catch (err) {
              alert(err);
            }
          };
          warDraw();
        } else if (cardValue(userCards.value) > cardValue(cpuCards.value)) {
          console.log("user card greater");
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${user_pile}/add/?cards=${bothCardCodes}`
              );
              doStartAnimation({ userWon: true, cpuWon: false });
              setCardsLeft({
                user: res.data.piles.user_pile.remaining,
                cpu: cpuDraw.data.piles.cpu_pile.remaining
              });
            } catch (err) {
              alert(err);
            }
          })();
        } else if (cardValue(userCards.value) < cardValue(cpuCards.value)) {
          console.log("cpu card greater");
          (async () => {
            try {
              const res = await axios.get(
                `${apiStart}/${id}/pile/${cpu_pile}/add/?cards=${bothCardCodes}`
              );
              doStartAnimation({ userWon: false, cpuWon: true });
              setCardsLeft({
                user: userDraw.data.piles.user_pile.remaining,
                cpu: res.data.piles.cpu_pile.remaining
              });
            } catch (err) {
              alert(err);
            }
          })();
        }
      }, 1500);
    } catch (err) {
      alert(err);
    }
  };
  //const face_down_card = `https://pics.livejournal.com/dailyafirmation/pic/002xt0qd`;

  return (
    <div style={{ textAlign: "center" }}>
      {(loggedIn === true || loggedIn === false) && (
        <button onClick={onGameStartTwo}>
          {!gameStart ? "Start" : "Restart"}
        </button>
      )}
      {gameStart &&
        loggedIn &&
        cardsLeft.user !== "" &&
        cardsLeft.cpu !== "" && <button onClick={onDrawTwo}>draw</button>}
      {cardsLeft.user !== "" && cardsLeft.cpu !== "" && gameStart && loggedIn && (
        <>
          {<p>Deck: {cardsLeft.cpu}</p>}
          <h2>CPU</h2>

          <DrawnCard
            showCard={cardDrawn.cpu}
            src={cardDrawn.cpu.image}
            alt={`${cardDrawn.cpu.value} of ${cardDrawn.cpu.suit}`}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
          />

          <br />
          <WarCards
            array={warCardArrays.cpu}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
          />
          {/*!!warCardArrays.cpu.length &&
            warCardArrays.cpu.map(item => (
              <IMG
                key={item.id}
                src={item.face_down ? PlayingCard : item.image}
                alt={`${item.value} of ${item.suit}`}
              />
            )) */}
          <br />
          <br />
          <br />
          <WarCards
            array={warCardArrays.user}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
          />
          {/*!!warCardArrays.user.length &&
            warCardArrays.user.map(item => (
              <IMG
                key={item.id}
                src={item.face_down ? PlayingCard : item.image}
                alt={`${item.value} of ${item.suit}`}
              />
            )) */}
          <br />

          <DrawnCard
            showCard={cardDrawn.user}
            src={cardDrawn.user.image}
            alt={`${cardDrawn.user.value} of ${cardDrawn.user.suit}`}
            cpuWonAnimation={startAnimation.cpuWon}
            userWonAnimation={startAnimation.userWon}
          />

          <h2>You</h2>
          {<p>Deck: {cardsLeft.user}</p>}
        </>
      )}
    </div>
  );
}

export default App;
