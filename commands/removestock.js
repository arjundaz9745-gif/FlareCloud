const fs = require("fs");
const path = require("path");

module.exports = {
    name: "removestock",
    description: "Clears all text from one or all stock files.",

    async execute(message, args) {

        // 🔒 ADMIN CHECK
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("<a:Wrong:1428669341838217216> You must be an **Administrator** to use this command.");
        }

        // No argument
        if (!args[0]) {
            return message.reply("<a:Wrong:1428669341838217216> Please provide a service name.\nExample: `$removestock Minecraft` or `$removestock all`");
        }

        const folderPath = path.join(__dirname, "..", "stock");
        const serviceName = args[0].toLowerCase();

        try {
            // ✅ CLEAR ALL FILES
            if (serviceName === "all") {
                const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".txt"));

                if (files.length === 0) {
                    return message.reply("<a:Error:1428669202608164864> No stock files found to clear.");
                }

                for (const file of files) {
                    fs.writeFileSync(path.join(folderPath, file), "", "utf8");
                }

                return message.reply(`<a:tick:1428738634118598706> Successfully cleared all text from **${files.length}** stock files.`);
            }

            // ✅ CLEAR SINGLE FILE
            const filePath = path.join(folderPath, `${serviceName}.txt`);

            if (!fs.existsSync(filePath)) {
                return message.reply(`<a:Error:1428669202608164864> File \`${serviceName}.txt\` not found in the stock folder.`);
            }

            fs.writeFileSync(filePath, "", "utf8");

            return message.reply(`<a:tick:1428738634118598706> Successfully cleared all text from \`${serviceName}.txt\`.`);

        } catch (err) {
            console.error(err);
            return message.reply("<a:Error:1428669202608164864> An error occurred while trying to clear the file(s).");
        }
    },
};
