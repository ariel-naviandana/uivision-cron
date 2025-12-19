const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('5,10 10-15 * * *', () => {
    console.log('UIVision running:', new Date());

    const url = 'file:///C:/coding/uivision-cron/uivision.html?macro=full_scrape_mtp_9_tables&direct=1&closeRPA=1&closeBrowser=1&storage=xfile';
    exec(`start chrome "${url}"`);
});

console.log('Scheduler aktif...');