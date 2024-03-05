// USER CONFIGURATION
const STEAM_USER_ID = "76561198287931804";
const cheapestAtNivqCents = 28;
// TODO: add this to popup or smth

async function fetchUserGamesPage() {
  const cachedUserGamesPage = await getGameStatusFromCache("USERGAMES");

  if (cachedUserGamesPage) {
    console.log("[User Library] Using cached user games page...");
    const parser = new DOMParser();
    const doc = parser.parseFromString(cachedUserGamesPage, "text/html");
    return Promise.resolve(doc);
  }

  console.log("[User Library] Fetching fresh user games page...");
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      `https://steamrep.com/util.php?op=getgames&id=${STEAM_USER_ID}`,
      (responseText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseText, "text/html");
        setGameStatusInCache("USERGAMES", responseText);
        resolve(doc);
      }
    );
  });
}

function checkIfUserOwnsGame(appId, doc) {
  const game = doc.querySelector(
    `a[href="https://steamcommunity.com/app/${appId}"]`
  );
  return !!game;
}

function getAppIdFromLink(link) {
  const url = new URL(link);
  const path = url.pathname;
  const appId = path.split("/")[2];
  return appId;
}

function getSteamLinks() {
  const dom = document.documentElement.outerHTML;
  const parser = new DOMParser();
  const doc = parser.parseFromString(dom, "text/html");
  const elements = doc.querySelectorAll("a");
  const links = [];
  elements.forEach((element) => {
    if (element.href && element.href.includes("store.steampowered.com/app/")) {
      if (!links.includes(element.href)) {
        links.push(element.href);
      }
    }
  });
  return links;
}

function getSteamPageContent(url) {
  // return fetch(url)
  //   .then((response) => response.text())
  //   .then((html) => {
  //     const parser = new DOMParser();
  //     const doc = parser.parseFromString(html, "text/html");
  //     return doc;
  //   });

  // avoid CORS error with a background page chrome.runtime.sendMessage(url,

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(url, (responseText) => {
      if (!responseText) {
        resolve(null);
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(responseText, "text/html");
      resolve(doc);
    });
  });
}

// game is limited if it has a div with class "learning_about" with a child div with class "label" that contains text "Profile Features Limited"
function getSteamGameLimitedStatus(doc) {
  const learningAbout = doc.querySelector(".learning_about");
  if (!learningAbout) {
    return false;
  }
  const label = learningAbout.querySelector(".label");
  if (!label) {
    return false;
  }
  return label.innerText.includes("Profile Features Limited");
}

function checkIfGameIsDLC(doc) {
  const game_area_dlc_bubble = doc.querySelector(".game_area_dlc_bubble");
  if (!game_area_dlc_bubble) {
    return false;
  }
  return game_area_dlc_bubble.innerText.includes(
    "This content requires the base game"
  );
}

function markLinkAsLimited(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    element.style.backgroundColor = "red";
    element.style.color = "white";
    element.appendChild(document.createTextNode(" (Limited)"));
  });
}

function markLinkAsOwned(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    element.style.backgroundColor = "green";
    element.style.color = "white";
    element.appendChild(document.createTextNode(" (Owned)"));
  });
}

function markLinkAsDLC(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    element.style.backgroundColor = "purple";
    element.style.color = "white";
    element.appendChild(document.createTextNode(" (DLC)"));
  });
}

function markLinkAsRemoved(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    element.style.backgroundColor = "yellow";
    element.style.color = "black";
    element.appendChild(document.createTextNode(" (Store page not found)"));
  });
}

function markLinkAsCorrect(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    element.appendChild(document.createTextNode(" ✔"));
  });
}

function markGameAsLoading(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    const loadingSpinner = new Image();
    loadingSpinner.src =
      "data:image/gif;base64,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";
    loadingSpinner.style.width = "15px";
    loadingSpinner.style.height = "15px";
    loadingSpinner.style.paddingLeft = "5px";
    loadingSpinner.className = "lpfchecker-loading-spinner";
    element.appendChild(loadingSpinner);
  });
}

function unmarkLoadingGame(link) {
  const linkElements = document.querySelectorAll(`a[href="${link}"]`);

  linkElements.forEach((element) => {
    const loadingSpinner = element.querySelector(".lpfchecker-loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.remove();
    }
  });
}

function updateBundleTitle(irrelevantAmount, totalAmount) {
  const bundleTitle = document.querySelector(
    "body > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr > td > table > tbody > tr > td.DIG3_14_Gray > table:nth-child(1) > tbody > tr > td:nth-child(1) > span"
  );
  bundleTitle.appendChild(
    document.createTextNode(
      ` (${irrelevantAmount} / ${totalAmount} Limited or Owned)`
    )
  );

  const relevantAmount = totalAmount - irrelevantAmount;
  const bundlePrice = getBundlePrice();
  const pricePerGame = bundlePrice / relevantAmount;

  bundleTitle.appendChild(document.createElement("br"));
  bundleTitle.appendChild(
    document.createTextNode(
      `${relevantAmount} games - $${pricePerGame.toFixed(2)} per game`
    )
  );

  const pricePerGameCents = Math.round(pricePerGame * 100);

  const marginCents = pricePerGameCents - cheapestAtNivqCents;

  const margin = marginCents / 100;
  const marginPercentage = (marginCents / cheapestAtNivqCents) * 100;

  const cheapestAtNivq = cheapestAtNivqCents / 100;

  bundleTitle.appendChild(document.createElement("br"));
  bundleTitle.appendChild(document.createElement("br"));

  const marginText = document.createElement("span");
  marginText.innerText = `Cheapest at Nivq ($${cheapestAtNivq}) - margin: $${margin.toFixed(
    2
  )} (${marginPercentage.toFixed(2)}%)`;
  marginText.style.color = margin < 0 ? "green" : "red";

  bundleTitle.appendChild(marginText);
}

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

function getBundlePrice() {
  const priceSpan = contains("span", "Bundle price")[0].innerText;
  const price = priceSpan.split(" ")[2].replace("$", "");
  return Number(price);
}

function getGameStatusFromCache(appId) {
  console.log(`Getting cached ${appId}...`);
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(appId, (result) => {
      if (result[appId]) {
        console.log(`Found cache item for ${appId}: ${result[appId]}`);
      }
      resolve(result[appId]);
    });
  });
}

function setGameStatusInCache(appId, status) {
  chrome.storage.local.set({ [appId]: status });
  console.log(`Cached ${appId}: ${status}`);
}

async function onWindowLoad() {
  console.log("[ LPF Checker loaded! ]");

  const links = getSteamLinks();
  const userGamesPage = await fetchUserGamesPage();

  console.log(userGamesPage);

  let limitedAmount = 0;
  const totalAmount = links.length;

  let ownedAmount = 0;

  let dlcAmount = 0;

  let removedAmount = 0;

  // update bundle title only when all links are checked - Promise.allSettled
  const promises = links.map(async (link) => {
    markGameAsLoading(link);
    const appId = getAppIdFromLink(link);
    const cachedStatus = await getGameStatusFromCache(appId);

    if (cachedStatus) {
      console.log(`Cache hit for ${link}: ${cachedStatus}`);
      switch (cachedStatus) {
        case "limited":
          markLinkAsLimited(link);
          limitedAmount++;
          break;
        case "owned":
          markLinkAsOwned(link);
          ownedAmount++;
          break;
        case "dlc":
          markLinkAsDLC(link);
          dlcAmount++;
          break;
        case "removed":
          markLinkAsRemoved(link);
          removedAmount++;
          break;
        default:
          markLinkAsCorrect(link);
          break;
      }

      unmarkLoadingGame(link);
      return;
    } else {
      const steamPageContent = await getSteamPageContent(link);

      if (steamPageContent) {
        const isLimited = getSteamGameLimitedStatus(steamPageContent);
        console.log(link, isLimited);

        if (isLimited) {
          markLinkAsLimited(link);
          limitedAmount++;
          setGameStatusInCache(appId, "limited");
        }

        const isDLC = checkIfGameIsDLC(steamPageContent);
        if (isDLC) {
          console.log(`DLC: ${link}`);
          markLinkAsDLC(link);
          dlcAmount++;
          setGameStatusInCache(appId, "dlc");
        }

        const userOwnsGame = checkIfUserOwnsGame(appId, userGamesPage);
        console.log(`User owns game: ${userOwnsGame}`);

        if (userOwnsGame) {
          console.log(`User owns game: ${link}`);

          markLinkAsOwned(link);
          ownedAmount++;
          setGameStatusInCache(appId, "owned");
        }

        if (!isLimited && !isDLC && !userOwnsGame) {
          markLinkAsCorrect(link);
          setGameStatusInCache(appId, "correct");
        }

        console.log(`Limited: ${limitedAmount} / ${totalAmount}`);
      } else {
        console.log(`Steam page not found: ${link}`);
        markLinkAsRemoved(link);
        removedAmount++;
        setGameStatusInCache(appId, "removed");
      }

      unmarkLoadingGame(link);
    }
  });

  Promise.allSettled(promises).then(() => {
    const irrelevantAmount =
      limitedAmount + ownedAmount + dlcAmount + removedAmount;

    updateBundleTitle(irrelevantAmount, totalAmount);
  });
}

window.onload = onWindowLoad;
