import { siteConfig } from "./siteConfig";

export default function DisclaimerContent() {
  return (
    <>
      <p>
        {siteConfig.name} par tum anjaan logon se baat karte ho. Kripya niche ki baatein dhyan se padho.
      </p>

      <h2>Users ka content</h2>
      <p>
        Chats mein jo bhi kaha ya dikhaya jata hai wo users ka apna hota hai. Hum live chat ko pehle se dekhte ya
        verify nahi karte, aur kisi user ki baat ke liye zimmedar nahi hain.
      </p>

      <h2>Apni suraksha</h2>
      <ul>
        <li>Naam, address, phone number, bank ya password jaisi personal jaankari share mat karo.</li>
        <li>Koi link ya file bhejne par bharosa mat karo jab tak pakka na ho.</li>
        <li>Asahaj lage to turant chat band karo, aur user ko report ya block karo.</li>
      </ul>

      <h2>Koi professional salah nahi</h2>
      <p>
        Chats mein mili jaankari medical, legal, financial ya kisi aur professional salah ka vikalp nahi hai.
      </p>

      <h2>Third-party links aur ads</h2>
      <p>
        Site par dikhne wale ads ya links third-party ke ho sakte hain. Unke content aur practices par hamara
        niyantran nahi hai.
      </p>

      <h2>Service ki uplabdhta</h2>
      <p>
        Hum guarantee nahi dete ki service hamesha chalegi ya error-free hogi. Aur jaankari ke liye{" "}
        <a href="/terms">Terms</a> dekho.
      </p>
    </>
  );
}