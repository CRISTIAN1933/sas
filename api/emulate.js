import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: "Falta el parámetro 'url'" });
  }

  let browser;
  try {
    // Lanzar Puppeteer en modo headless
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();

    // Configurar User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    );

    // 1️⃣ Ir a la página
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 2️⃣ Verificar si existe el botón
    const boton = await page.$('form#activar-form button.button-activar');
    const botonExiste = boton !== null;
    let botonPresionado = false;
    let enlaceBoxVisible = false;
    let enlaceUrl = null;

    if (botonExiste) {
      // 3️⃣ Presionar el botón
      await boton.click();
      botonPresionado = true;

      // 4️⃣ Esperar a que aparezca el div "enlace-box"
      try {
        await page.waitForSelector('div.enlace-box', { timeout: 3000 });
        enlaceBoxVisible = true;

        // 5️⃣ Extraer la URL del input dentro de enlace-box
        const inputHandle = await page.$('div.enlace-box input#enlace');
        if (inputHandle) {
          enlaceUrl = await page.evaluate(input => input.value, inputHandle);
        }
      } catch {
        enlaceBoxVisible = false;
        enlaceUrl = null;
      }
    }

    // 6️⃣ Devolver resultado en JSON
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
