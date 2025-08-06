'use strict'

const DEBUG = null;

let W3DHub = {}

W3DHub.TIMEZONES = [
  "America/Los_Angeles",
  "America/New_York",
  "Australia/Sydney"
];

W3DHub.Box = class {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

W3DHub.GameNightGenerator = class {
  constructor() {
    let context = this;

    this.cards = {
      date: new W3DHub.Box(224.0, 424.0 + 36, 272.0, 216.0 - 36),
      server: new W3DHub.Box(504.0, 424.0 + 36, 272.0, 216.0 - 36),
      discord: new W3DHub.Box(784.0, 424.0 + 36, 272.0, 216.0 - 36)
    }

    this.image_container = document.querySelector("#image_preview");

    this.template_element = document.querySelector("#template");
    this.text_color_element = document.querySelector("#color");
    this.outline_color_element = document.querySelector("#outline_color");
    this.date_element = document.querySelector("#date");
    this.time_element = document.querySelector("#time");
    this.backdrop_element = document.querySelector("#backdrop");

    this.save_element = document.querySelector("#save");

    this.image_container.innerHTML = "";

    this.canvas_element = document.createElement("canvas");
    this.canvas_element.width = 1280;
    this.canvas_element.height = 720;
    this.canvas_element.style.width = "100%";
    this.canvas_element.style.height = null;
    this.canvas_element.style.display = "block";

    this.canvas = this.canvas_element.getContext("2d");

    this.image_container.appendChild(this.canvas_element);

    this.discord_image = document.createElement("img");
    this.discord_image.src = this.url("/media/discord.png");

    this.template_image = document.createElement("img");
    this.template_image.src = this.url("/media/" + this.template_element.value.toLowerCase() + ".png");
    this.backdrop_image = document.createElement("img");
    this.backdrop_image.addEventListener("load", function () {
      context.render(context);
    });

    if (this.backdrop_element.files.length > 0) {
      this.backdrop_image.src = this.to_data_url(this.backdrop_element.files[0]);

      this.backdrop_image.addEventListener("load", function () {
        context.render(context);
      });
    }

    [this.discord_image, this.template_image].forEach(element => {
      element.addEventListener("load", function () {
        context.render(context);
      });
    });

    this.template_element.addEventListener("change", function () {
      context.template_image.src = context.url("/media/" + context.template_element.value.toLowerCase() + ".png");
    });

    [this.text_color_element, this.outline_color_element, this.date_element, this.time_element].forEach(element => {
      element.addEventListener("change", function () {
        context.render(context);
      });
    });

    this.backdrop_element.addEventListener("change", function () {
      context.backdrop_image.src = context.to_data_url(context.backdrop_element.files[0]);
    });
  }

  url(path) {
    let protocol = window.location.protocol;

    if (protocol.startsWith("https")) {
      return "/game_night_generator" + path;
    }

    return path;
  }

  to_data_url(file) {
    return URL.createObjectURL(file);
  }

  render(context) {
    context.canvas.clearRect(0, 0, context.canvas_element.width, context.canvas_element.height);

    // ----------------------------------------------
    // Backdrop and Overlay Template
    context.draw_image(context.backdrop_image, 0, 0, 1280.0);
    context.draw_image(context.template_image, 0, 0, 1280.0);

    let card;
    let text_size = 28;

    let text_color = context.text_color_element.value;
    let text_outline_color = context.outline_color_element.value;

    // ----------------------------------------------
    // Time Card
    card = context.cards["date"];
    let js_date = this.sane_js_time(context.date_element.value, context.time_element.value);

    if (js_date && isFinite(js_date)) {
      let gmt_day = this.sane_js_strftime(js_date, "GMT", { weekday: "long" });
      let gmt_month_day = this.sane_js_strftime(js_date, "GMT", { month: "long", day: "numeric" });
      let gmt_utc_time = this.sane_js_strftime(js_date, "GMT", { hour: "numeric", minute: "numeric" });

      let date_size = 36;
      context.draw_text(gmt_day.toUpperCase(), date_size, card.x + card.width / 2, card.y + 8, text_color, text_outline_color);
      context.draw_text(gmt_month_day.toUpperCase(), date_size, card.x + card.width / 2, card.y + 8 + date_size, text_color, text_outline_color);

      let time_size = 32;
      context.draw_text(gmt_utc_time + " GMT".toUpperCase(), time_size, card.x + card.width / 2, card.y + card.height - (8 + time_size + 16 + 6), text_color, text_outline_color, "bottom", "center");

      let zone_size = 17.5;
      let i = 0;
      Array.from(W3DHub.TIMEZONES).reverse().forEach(timezone => {
        let day_options = { day: 'numeric' }
        let utc_day = context.sane_js_strftime(js_date, "GMT", day_options);
        let tz_day = context.sane_js_strftime(js_date, timezone, day_options);

        let same_day = utc_day == tz_day;

        let options;
        if (same_day) {
          options = { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
        } else {
          options = { weekday: 'short', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
        }

        let string = context.sane_js_strftime(js_date, timezone, options).replace(" am ", " AM ").replace(" pm ", " PM ");

        context.draw_text(string, zone_size, card.x + card.width - 8, card.y + card.height - (8 + i * zone_size), text_color, text_outline_color, "bottom", "right");

        i++;
      });
    }

    // ----------------------------------------------
    // Server Card
    card = context.cards["server"];
    let height = (card.height / 2) - (text_size * 3) / 2;

    context.draw_text("W3D Hub".toUpperCase(), text_size, card.x + card.width / 2, card.y + 8 + height, text_color, text_outline_color);
    context.draw_text(context.template_element.value.toUpperCase(), text_size, card.x + card.width / 2, card.y + 8 + height + text_size, text_color, text_outline_color);
    context.draw_text("Game Server".toUpperCase(), text_size, card.x + card.width / 2, card.y + 8 + height + text_size + text_size, text_color, text_outline_color);

    // ----------------------------------------------
    // Discord Card
    card = context.cards["discord"];

    this.draw_image(context.discord_image, 884.5, 536.694, 72);

    context.draw_text("W3D Hub".toUpperCase(), 28, card.x + card.width / 2, card.y + 8, text_color, text_outline_color);
    context.draw_text("Discord Server".toUpperCase(), 28, card.x + card.width / 2, card.y + 8 + 36, text_color, text_outline_color);

    context.draw_text("https://discord.gg/jMmmRa2", 17.5, card.x + card.width / 2, card.y + card.height - 8, text_color, text_outline_color, "bottom");

    // ----------------------------------------------
    // UPDATE SAVE BUTTON DATA
    context.save_element.href = context.canvas_element.toDataURL("image/png");
    context.save_element.download = context.template_element.value.toLowerCase() + "_game_night.png";
  }

  hex_to_rgba(hex, alpha = 0.5) {
    hex = parseInt(hex.replace("#", ""), 16);
    hex >>>= 0;

    let b = hex & 0xFF;
    let g = (hex & 0xFF00) >>> 8;
    let r = (hex & 0xFF0000) >>> 16;

    return "rgba(" + r + "," + g + "," + b + "," + alpha;
  }

  draw_text(text, size, x, y, color, outline_color, baseline = "top", align = "center") {
    let font = "" + size + "px Noto Sans Bold, sans-serif";

    this.canvas.font = font;
    this.canvas.fillStyle = this.hex_to_rgba(color, 1.0);
    this.canvas.strokeStyle = this.hex_to_rgba(outline_color, 0.5);
    this.canvas.lineWidth = 1.0;
    this.canvas.textBaseline = baseline;
    this.canvas.textAlign = align;

    this.canvas.fillText(text, x, y);
    this.canvas.strokeText(text, x, y);
  }

  draw_image(image, x, y, width) {
    let scale = width / image.width;

    this.canvas.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * scale, image.height * scale);
  }

  sane_js_time(date, time) {
    let date_parts = date.split("-");
    let time_parts = time.split(":");

    let year = parseInt(date_parts[0], 10);
    let month = parseInt(date_parts[1], 10) - 1; // JS is insane!
    let day = parseInt(date_parts[2], 10);

    let hour = parseInt(time_parts[0]);
    let minutes = parseInt(time_parts[1]);

    return new Date(Date.UTC(year, month, day, hour, minutes));
  }

  sane_js_strftime(js_date, timezone, options) {
    options.timeZone = timezone;

    let au = timezone.toLowerCase().includes("australia");

    if (au) {
      return new Intl.DateTimeFormat('en-AU', options).format(js_date);
    }

    return new Intl.DateTimeFormat('en-US', options).format(js_date);
  }
}



window.addEventListener("load", function () {
  new W3DHub.GameNightGenerator();
});

console.log("A tool created by: cyberarm (https://cyberarm.dev)");
