import fs from "fs";

function loadDeployments() {
    const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
    return deployments;
}


