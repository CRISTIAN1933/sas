import chromium from 'chrome-aws-lambda';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: "Falta el parámetro 'url'" });
  }

  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: 'networkidle2' });

    const boton = await page.$('form#activar-form button.button-activar');
    const botonExiste = boton !== null;
    let botonPresionado = false;
    let enlaceBoxVisible = false;
    let enlaceUrl = null;

    if (botonExiste) {
      await boton.click();
      botonPresionado = true;

      try {
        await page.waitForSelector('div.enlace-box', { timeout: 3000 });
        enlaceBoxVisible = true;

        const inputHandle = await page.$('div.enlace-box input#enlace');
        if (inputHandle) {
          enlaceUrl = await page.evaluate(input => input.value, inputHandle);
        }
      } catch {
        enlaceBoxVisible = false;
        enlaceUrl = null;
      }
    }

    res.status(200).json({
      success: true,
      botonExiste,
      botonPresionado,
      enlaceBoxVisible,
      enlaceUrl
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al ejecutar Puppeteer",
      error: err.message
    });
  } finally {
    if (browser) await browser.close();
  }
}
