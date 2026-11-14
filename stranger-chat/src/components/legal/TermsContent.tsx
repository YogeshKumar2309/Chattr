import { siteConfig } from "./siteConfig";

export default function TermsContent() {
  return (
    <>
      <p>
        {siteConfig.name} use karke tum in Terms se sahmat ho. Agar sahmat nahi ho, to please service use mat karo.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        Service sirf {siteConfig.minAge} saal ya usse bade logon ke liye hai. Chat shuru karne se pehle tum confirm
        karte ho ki tumhari umar {siteConfig.minAge}+ hai. Galat confirmation dena in Terms ka ulanghan hai.
      </p>

      <h2>2. Kya allowed nahi hai</h2>
      <ul>
        <li>Kisi ko harass, dhamkana, bully ya hate failana.</li>
        <li>Nuksaan wala ya illegal content share karna.</li>
        <li>Nabaaligon se related koi bhi sexual ya shoshan wala content. Ye zero tolerance hai.</li>
        <li>Kisi ki personal jaankari bina permission share karna ya unki chat/video record karna.</li>
        <li>Spam, scam, paise maangna ya fraud.</li>
        <li>Service ko hack karna, tod-phod karna ya automated bots se use karna.</li>
        <li>Kisi aur ke naam se impersonate karna.</li>
      </ul>

      <h2>3. Tumhari zimmedari</h2>
      <p>
        Tum jo bhi bhejte ya bolte ho uski zimmedari tumhari hai. Anjaan logon se baat karte waqt savdhan raho.
        Dusre user ki baatein hamari taraf se verify nahi hoti.
      </p>

      <h2>4. Report aur block</h2>
      <p>
        Tum kisi bhi user ko report ya block kar sakte ho. Hum reports dekhte hain aur zaroorat padne par access rok
        sakte hain.
      </p>

      <h2>5. Content aur privacy</h2>
      <p>
        Chats peer-to-peer hoti hain aur messages dono browsers mein {siteConfig.retentionHours} ghante tak rehte
        hain. Detail ke liye <a href="/privacy">Privacy Policy</a> dekho.
      </p>

      <h2>6. Access band karna</h2>
      <p>
        In Terms ka ulanghan karne par hum bina notice ke tumhara access rok sakte hain ya service ka koi hissa
        badal ya band kar sakte hain.
      </p>

      <h2>7. Koi guarantee nahi</h2>
      <p>
        Service &quot;jaise hai waise&quot; di jaati hai. Hum ye guarantee nahi dete ki ye hamesha chalegi, error-free
        hogi ya kisi khaas user se match karayegi.
      </p>

      <h2>8. Zimmedari ki seema</h2>
      <p>
        Kanoon ki anumati ki had tak, {siteConfig.name} kisi user ke vyavhar, content ya service use karne se hue
        nuksaan ke liye zimmedar nahi hoga.
      </p>

      <h2>9. Governing law</h2>
      <p>Ye Terms Bharat ke kanoon ke adheen hain. Vivaad ki sthiti mein Bharat ki adalatein adhikar-kshetra rakhti hain.</p>

      <h2>10. Badlav</h2>
      <p>
        Hum ye Terms kabhi bhi badal sakte hain. Badlav ke baad service use karte rehna naye Terms ko manna maana
        jayega.
      </p>

      <h2>11. Contact</h2>
      <p>
        Sawal ho to <a href="/contact">Contact</a> page dekho ya <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>{" "}
        par likho.
      </p>
    </>
  );
}