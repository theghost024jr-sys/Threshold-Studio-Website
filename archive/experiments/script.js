console.log("JS connected");
document.querySelector(".portal-link").addEventListener("click", (e) => {
  e.preventDefault(); // stop any navigation

  const reveal = document.querySelector(".jewelry-reveal");
  const images = Array.from(reveal.querySelectorAll(".reveal-img"));

 images.forEach(img => {
    img.dataset.role = "";
  });

const hubIndex = Math.floor(Math.random() * images.length);
  images[hubIndex].dataset.role = "hub";

images.forEach((img, i) => {
    if (i !== hubIndex) {
      img.dataset.role = "chamber";
    }
  });

 reveal.classList.remove("hidden");
  setTimeout(() => reveal.classList.add("visible"), 50);
});

document.querySelectorAll(".reveal-img").forEach(img => {
  img.addEventListener("click", () => {
    const role = img.dataset.role;

    if (role === "hub") {
      openHub();
    } else if (role === "chamber") {
      openChamber();
    }
  });
});

function openHub() {
  const hub = document.querySelector(".hub");
  hub.classList.remove("hidden");
  setTimeout(() => hub.classList.add("visible"), 50);
}

function openChamber() {
  const chamber = document.querySelector(".chamber-area");
  chamber.classList.remove("hidden");
  setTimeout(() => chamber.classList.add("visible"), 50);
}


  
  