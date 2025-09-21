const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "Falta el parámetro ?url",
    });
  }

  let browser = null;
  try {
    // Lanzar Chromium compatible con Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Navegar a la página
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Revisar si existe el botón "activar"
    const buttonExists = await page.$("button, input[type=button], input[type=submit]") !== null;

    return res.json({
      success: true,
      url,
      pageLoaded: true,
      activarButton: buttonExists,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error al ejecutar Puppeteer",
      error: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
};
