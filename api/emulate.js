import chromium from "chrome-aws-lambda";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: "Falta el parámetro 'url'" });
  }

  let browser = null;

  try {
    // Lanzar Chromium portable de chrome-aws-lambda
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Verificar si existe el botón
    const botonExiste = await page.$(".button-activar") !== null;

    let botonPresionado = false;
    let enlaceBoxVisible = false;

    if (botonExiste) {
      // Simular click en el botón
      await page.click(".button-activar");

      // Esperar que aparezca el div "enlace-box"
      try {
        await page.waitForSelector(".enlace-box", { timeout: 5000 });
        botonPresionado = true;
        enlaceBoxVisible = true;
      } catch {
        botonPresionado = true;
        enlaceBoxVisible = false;
      }
    }

    res.status(200).json({
      success: true,
      botonExiste,
      botonPresionado,
      enlaceBoxVisible,
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      message: "Error al ejecutar Puppeteer",
      error: err.message,
    });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
