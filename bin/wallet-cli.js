#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_spinner_1 = require("cli-spinner");
const colors_1 = require("colors");
const safe_1 = require("colors/safe");
const CFonts = require('cfonts');
const prompt = require('prompt');
const fs = require('fs');
const os = require('os');
const nem_library_1 = require("nem-library");
const wallet_1 = require("../src/wallet");
const mosaicSettings = require('../src/mosaic-settings.json');
const MOSAIC_NAME = mosaicSettings.mosaic_name;
const args = process.argv.slice(2);
const PATH_HOME = `${os.homedir()}/${MOSAIC_NAME}-wallets`;
const PATH_WALLET = `${PATH_HOME}/${MOSAIC_NAME}-wallet.wlt`;
let selectedAccount;
if (args.length === 0) {
    CFonts.say(`${MOSAIC_NAME}`, { colors: ['cyan'] });
    console.log(`Usage:

	${MOSAIC_NAME} balance
		Gets your current wallet balance and public address
	
	${MOSAIC_NAME} send <amount> <address>
		Sends ${MOSAIC_NAME} from your wallet to the specified address
	
	${MOSAIC_NAME} wallet create
		Guides you through creating a new ${MOSAIC_NAME} wallet
	`);
    process.exit(1);
}
const downloadWallet = (wallet) => {
    console.log(colors_1.white(`\n\nDownloading wallet for your convenience.\n\nPlease store someplace safe. The private key is encrypted by your password.\n\nTo load this wallet on a new computer you would simply import the .wlt file into this app and enter your password and you'll be able to sign transactions.
	`));
    if (!fs.existsSync(PATH_HOME)) {
        fs.mkdirSync(PATH_HOME);
    }
    let fullPath = PATH_WALLET;
    if (fs.existsSync(fullPath)) {
        const stamp = new Date().toISOString();
        fullPath = `${PATH_HOME}/${stamp}-${MOSAIC_NAME}-wallet.wlt`;
    }
    fs.writeFileSync(fullPath, wallet.writeWLTFile());
    console.log(safe_1.green(`Downloaded wallet to ${fullPath}`));
};
const createPwd = () => {
    console.log(colors_1.white(`\nPlease enter a unique password ${safe_1.yellow('(8 character minimum)')}.\n 
This password will be used to encrypt your private key and make working with your wallet easier.\n\n`));
    console.log(safe_1.red(`Store this password somewhere safe. If you lose or forget it you will never be able to transfer funds\n`));
    prompt.message = colors_1.white(`${MOSAIC_NAME} wallet`);
    prompt.start();
    prompt.get({
        properties: {
            password: {
                description: colors_1.white('Password'),
                hidden: true
            },
            confirmPass: {
                description: colors_1.white('Re-enter password'),
                hidden: true
            }
        }
    }, (_, result) => __awaiter(this, void 0, void 0, function* () {
        if (result.password !== result.confirmPass) {
            console.log(safe_1.magenta('\nPasswords do not match.\n\n'));
            createPwd();
        }
        else {
            const wallet = wallet_1.createSimpleWallet(result.password);
            const pass = new nem_library_1.Password(result.password);
            const account = wallet.open(pass);
            const address = account.address.pretty();
            console.log(safe_1.green(`${MOSAIC_NAME} wallet successfully created.`));
            console.log(colors_1.white(`You can now start sending and receiving ${MOSAIC_NAME}!`));
            console.log(colors_1.white(`\n${MOSAIC_NAME} Public Address:`));
            console.log(safe_1.yellow(`${address}`));
            console.log(colors_1.white(`\nPrivate Key:`));
            console.log(safe_1.yellow(`${account.privateKey}`));
            yield downloadWallet(wallet);
        }
    }));
};
const attemptWalletOpen = (wallet) => {
    return new Promise((resolve, reject) => {
        prompt.message = colors_1.white('wallet login');
        prompt.start();
        prompt.get({
            properties: {
                password: {
                    description: colors_1.white('Password'),
                    hidden: true
                }
            }
        }, (_, result) => {
            const pass = new nem_library_1.Password(result.password);
            try {
                resolve(wallet.open(pass));
            }
            catch (err) {
                console.log(safe_1.red(`${err}`));
                console.log(colors_1.white('Please try again'));
                reject();
            }
        });
    });
};
const loadWallet = () => {
    const contents = fs.readFileSync(PATH_WALLET);
    return nem_library_1.SimpleWallet.readFromWLT(contents);
};
const printBalance = (onBalance) => __awaiter(this, void 0, void 0, function* () {
    const wallet = loadWallet();
    try {
        const account = yield attemptWalletOpen(wallet);
        selectedAccount = account;
        console.log('\n');
        console.log(`\n${colors_1.white('Public Address:')} ${colors_1.white(account.address.pretty())}\n`);
        const spinner = new cli_spinner_1.Spinner(safe_1.yellow('Fetching balance... %s'));
        spinner.setSpinnerString(0);
        spinner.start();
        const balances = yield wallet_1.getAccountBalances(account);
        const mosaic = yield wallet_1.mosaicBalance(balances);
        const xem = yield wallet_1.xemBalance(balances);
        spinner.stop();
        const bal = (mosaic / 1e6).toString();
        const xemBal = (xem / 1e6).toString();
        console.log('\n');
        console.log(`\n${colors_1.white('XEM Balance:')} ${colors_1.white(xemBal)}`);
        console.log(`\n${colors_1.white(`${MOSAIC_NAME} Balance:`)} ${colors_1.white(bal)}\n`);
        onBalance(mosaic / 1e6);
    }
    catch (err) {
        if (err) {
            console.log(err);
        }
    }
});
const main = () => __awaiter(this, void 0, void 0, function* () {
    if (args[0] === 'wallet') {
        if (args[1] === 'create') {
            createPwd();
        }
    }
    else {
        if (!fs.existsSync(PATH_WALLET)) {
            const file = `${MOSAIC_NAME}-wallet.wlt`;
            console.log(safe_1.red(`Cannot find default wallet. Please place a file named ${colors_1.white(file)} at this location: ${PATH_WALLET}`));
            process.exit(1);
        }
        if (args[0] === 'balance') {
            yield printBalance(_ => { });
        }
        else if (args[0] === 'send') {
            yield printBalance((balance) => __awaiter(this, void 0, void 0, function* () {
                const amt = parseFloat(args[1]);
                const address = args[2];
                if (isNaN(amt)) {
                    console.log(safe_1.red('Must provide a valid number with maximum of 6 digits ie 10.356784'));
                    process.exit(1);
                }
                if (!address) {
                    console.log(safe_1.red('Must provide a valid recipient address'));
                    process.exit(1);
                }
                if (amt > balance) {
                    console.log(safe_1.red(`You don't have enough ${MOSAIC_NAME} to send`));
                    process.exit(1);
                }
                try {
                    const preTransaction = yield wallet_1.prepareTransfer(address, amt);
                    const xemFee = (preTransaction.fee / 1e6).toString();
                    console.log(colors_1.white('Transaction Details: \n'));
                    console.log(`Recipient:          ${safe_1.yellow(address)}\n`);
                    console.log(`${MOSAIC_NAME} to send:      ${safe_1.yellow(amt.toString())}\n`);
                    console.log(`XEM Fee:            ${safe_1.yellow(xemFee)}\n\n`);
                    console.log(`${colors_1.white('Would you like to proceed?\n')}`);
                    prompt.message = colors_1.white(`${MOSAIC_NAME} Transfer`);
                    prompt.start();
                    prompt.get({
                        properties: {
                            confirmation: {
                                description: safe_1.yellow('Proceed? ( y/n )')
                            }
                        }
                    }, (_, result) => __awaiter(this, void 0, void 0, function* () {
                        if (result.confirmation.toLowerCase() === 'y' || result.confirmation.toLowerCase() === 'yes') {
                            try {
                                const result = yield wallet_1.sendMosaic(address, amt, selectedAccount);
                                console.log(result);
                                console.log('\n\n');
                                console.log(colors_1.white('Transaction successfully announced to the NEM blockchain. Transaction could take some time. Come back here in 5 minutes to check your balance to ensure that the transaction was successfully sent\n'));
                            }
                            catch (err) {
                                console.log(safe_1.red(err));
                            }
                        }
                        else {
                            console.log('Transaction canceled');
                            process.exit(1);
                        }
                    }));
                }
                catch (err) {
                    console.log(`\n${err}\n`);
                }
            }));
        }
    }
});
main();
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log('Wallet closed');
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0LWNsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldC1jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFHQSw2Q0FBc0M7QUFDdEMsbUNBQStCO0FBQy9CLHNDQUEwRDtBQUMxRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBR2pDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFHekIsNkNBQThEO0FBRzlELDBDQUV1QjtBQUd2QixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsV0FBVyxDQUFDO0FBTS9DLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBR25DLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLFdBQVcsVUFBVSxDQUFDO0FBQzNELE1BQU0sV0FBVyxHQUFHLEdBQUcsU0FBUyxJQUFJLFdBQVcsYUFBYSxDQUFDO0FBRzdELElBQUksZUFBd0IsQ0FBQztBQUs3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUM7O0dBRVYsV0FBVzs7O0dBR1gsV0FBVztVQUNKLFdBQVc7O0dBRWxCLFdBQVc7c0NBQ3dCLFdBQVc7RUFDL0MsQ0FB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QUMsR0FBRyxDQUFDLENBQUM7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG4vLyBQYWNrYWdlcyBmb3IgdXNlciBpbnB1dCBhbmQgZGlzcGxheSBmb3IgQ0xJXG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnY2xpLXNwaW5uZXInO1xuaW1wb3J0IHsgd2hpdGUgfSBmcm9tICdjb2xvcnMnO1xuaW1wb3J0IHsgZ3JlZW4sIG1hZ2VudGEsIHJlZCwgeWVsbG93IH0gZnJvbSAnY29sb3JzL3NhZmUnO1xuY29uc3QgQ0ZvbnRzID0gcmVxdWlyZSgnY2ZvbnRzJyk7XG5jb25zdCBwcm9tcHQgPSByZXF1aXJlKCdwcm9tcHQnKTtcblxuLy8gZnMgYW5kIG9zIGFyZSBuYXRpdmUgbm9kZSBwYWNrYWdlcyBmb3Igd29ya2luZyB3aXRoIGZpbGUgc3lzdGVtXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cbi8vIE9mZmljaWFsIG5lbS1saWJyYXJ5XG5pbXBvcnQgeyBQYXNzd29yZCwgU2ltcGxlV2FsbGV0LCBBY2NvdW50IH0gZnJvbSAnbmVtLWxpYnJhcnknO1xuXG4vLyBXYWxsZXQgZnVuY3Rpb25zIGZvciB0aGlzIGFwcFxuaW1wb3J0IHtcblx0bW9zYWljQmFsYW5jZSwgY3JlYXRlU2ltcGxlV2FsbGV0LCBnZXRBY2NvdW50QmFsYW5jZXMsIHByZXBhcmVUcmFuc2Zlciwgc2VuZE1vc2FpYywgeGVtQmFsYW5jZVxufSBmcm9tICcuLi9zcmMvd2FsbGV0JztcblxuLy8gSlNPTiBGaWxlIGZvciBtb3NhaWMgc2V0dGluZ3MgLSBjYW4gYmUgcmVwbGFjZWQgd2l0aCBhbnkgbW9zYWljXG5jb25zdCBtb3NhaWNTZXR0aW5ncyA9IHJlcXVpcmUoJy4uL3NyYy9tb3NhaWMtc2V0dGluZ3MuanNvbicpO1xuY29uc3QgTU9TQUlDX05BTUUgPSBtb3NhaWNTZXR0aW5ncy5tb3NhaWNfbmFtZTtcblxuLy8gTXVzdCBkZWNsYXJlIHByb2Nlc3Mgc2luY2UgVHlwZXNjcmlwdCBkb2Vzbid0IGtub3cgYWJvdXQgaXRcbmRlY2xhcmUgbGV0IHByb2Nlc3M6IGFueTtcblxuLy8gR3JhYiB1c2VyIGFyZ3VtZW50cyBmcm9tIGNvbW1hbmQgbGluZVxuY29uc3QgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuLy8gUGF0aHMgZm9yIHNhdmluZyBhbmQgbG9hZGluZyB3YWxsZXRzXG5jb25zdCBQQVRIX0hPTUUgPSBgJHtvcy5ob21lZGlyKCl9LyR7TU9TQUlDX05BTUV9LXdhbGxldHNgO1xuY29uc3QgUEFUSF9XQUxMRVQgPSBgJHtQQVRIX0hPTUV9LyR7TU9TQUlDX05BTUV9LXdhbGxldC53bHRgO1xuXG4vLyBXaGVuIGFuIGFjY291bnQgaXMgbG9hZGVkIHN0b3JlIGl0IHNvIGl0IGNhbiBiZSB1c2VkIGxhdGVyXG5sZXQgc2VsZWN0ZWRBY2NvdW50OiBBY2NvdW50O1xuXG4vKipcbiAqIFNob3cgYXZhaWxhYmxlIGNvbW1hbmRzIGZvciB0aGUgdXNlclxuICovXG5pZiAoYXJncy5sZW5ndGggPT09IDApIHtcblx0Q0ZvbnRzLnNheShgJHtNT1NBSUNfTkFNRX1gLCB7IGNvbG9yczogWydjeWFuJ119KTtcblx0Y29uc29sZS5sb2coYFVzYWdlOlxuXG5cdCR7TU9TQUlDX05BTUV9IGJhbGFuY2Vcblx0XHRHZXRzIHlvdXIgY3VycmVudCB3YWxsZXQgYmFsYW5jZSBhbmQgcHVibGljIGFkZHJlc3Ncblx0XG5cdCR7TU9TQUlDX05BTUV9IHNlbmQgPGFtb3VudD4gPGFkZHJlc3M+XG5cdFx0U2VuZHMgJHtNT1NBSUNfTkFNRX0gZnJvbSB5b3VyIHdhbGxldCB0byB0aGUgc3BlY2lmaWVkIGFkZHJlc3Ncblx0XG5cdCR7TU9TQUlDX05BTUV9IHdhbGxldCBjcmVhdGVcblx0XHRHdWlkZXMgeW91IHRocm91Z2ggY3JlYXRpbmcgYSBuZXcgJHtNT1NBSUNfTkFNRX0gd2FsbGV0XG5cdGApO1xuXHRwcm9jZXNzLmV4aXQoMSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtTaW1wbGVXYWxsZXR9IHdhbGxldCBUaGUgU2ltcGxlV2FsbGV0IHRvIGRvd25sb2FkIHRvIHRoZSBoYXJkIGRyaXZlXG4gKiBJZiBkZWZhdWx0IHdhbGxldCBhbHJlYWR5IGV4aXN0cyBpdCB3aWxsIGFkZCBhIHRpbWVzdGFtcCB0byB0aGUgd2FsbGV0IHBhdGggb2ZcbiAqIHRoaXMgbmV3IHdhbGxldFxuICovXG5jb25zdCBkb3dubG9hZFdhbGxldCA9ICh3YWxsZXQ6IFNpbXBsZVdhbGxldCkgPT4ge1xuXHRjb25zb2xlLmxvZyh3aGl0ZShgXFxuXFxuRG93bmxvYWRpbmcgd2FsbGV0IGZvciB5b3VyIGNvbnZlbmllbmNlLlxcblxcblBsZWFzZSBzdG9yZSBzb21lcGxhY2Ugc2FmZS4gVGhlIHByaXZhdGUga2V5IGlzIGVuY3J5cHRlZCBieSB5b3VyIHBhc3N3b3JkLlxcblxcblRvIGxvYWQgdGhpcyB3YWxsZXQgb24gYSBuZXcgY29tcHV0ZXIgeW91IHdvdWxkIHNpbXBseSBpbXBvcnQgdGhlIC53bHQgZmlsZSBpbnRvIHRoaXMgYXBwIGFuZCBlbnRlciB5b3VyIHBhc3N3b3JkIGFuZCB5b3UnbGwgYmUgYWJsZSB0byBzaWduIHRyYW5zYWN0aW9ucy5cblx0YCkpO1xuXG5cdGlmICghZnMuZXhpc3RzU3luYyhQQVRIX0hPTUUpKSB7XG5cdFx0ZnMubWtkaXJTeW5jKFBBVEhfSE9NRSk7XG5cdH1cblxuXHRsZXQgZnVsbFBhdGggPSBQQVRIX1dBTExFVDtcblx0aWYgKGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XG5cdFx0Y29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cdFx0ZnVsbFBhdGggPSBgJHtQQVRIX0hPTUV9LyR7c3RhbXB9LSR7TU9TQUlDX05BTUV9LXdhbGxldC53bHRgXG5cdH1cblx0ZnMud3JpdGVGaWxlU3luYyhmdWxsUGF0aCwgd2FsbGV0LndyaXRlV0xURmlsZSgpKTtcblxuXHRjb25zb2xlLmxvZyhncmVlbihgRG93bmxvYWRlZCB3YWxsZXQgdG8gJHtmdWxsUGF0aH1gKSlcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBwYXNzd29yZCB3aGVuIG1ha2luZyBhIG5ldyB3YWxsZXRcbiAqL1xuY29uc3QgY3JlYXRlUHdkID0gKCkgPT4ge1xuXHRjb25zb2xlLmxvZyh3aGl0ZShcblx0XHRgXFxuUGxlYXNlIGVudGVyIGEgdW5pcXVlIHBhc3N3b3JkICR7eWVsbG93KCcoOCBjaGFyYWN0ZXIgbWluaW11bSknKX0uXFxuIFxuVGhpcyBwYXNzd29yZCB3aWxsIGJlIHVzZWQgdG8gZW5jcnlwdCB5b3VyIHByaXZhdGUga2V5IGFuZCBtYWtlIHdvcmtpbmcgd2l0aCB5b3VyIHdhbGxldCBlYXNpZXIuXFxuXFxuYFxuXHQpKTtcblx0Y29uc29sZS5sb2cocmVkKFxuXHRcdGBTdG9yZSB0aGlzIHBhc3N3b3JkIHNvbWV3aGVyZSBzYWZlLiBJZiB5b3UgbG9zZSBvciBmb3JnZXQgaXQgeW91IHdpbGwgbmV2ZXIgYmUgYWJsZSB0byB0cmFuc2ZlciBmdW5kc1xcbmBcblx0KSk7XG5cdHByb21wdC5tZXNzYWdlID0gd2hpdGUoYCR7TU9TQUlDX05BTUV9IHdhbGxldGApO1xuXHRwcm9tcHQuc3RhcnQoKTtcblx0cHJvbXB0LmdldCh7XG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0cGFzc3dvcmQ6IHtcblx0XHRcdFx0ZGVzY3JpcHRpb246IHdoaXRlKCdQYXNzd29yZCcpLFxuXHRcdFx0XHRoaWRkZW46IHRydWVcblx0XHRcdH0sXG5cdFx0XHRjb25maXJtUGFzczoge1xuXHRcdFx0XHRkZXNjcmlwdGlvbjogd2hpdGUoJ1JlLWVudGVyIHBhc3N3b3JkJyksXG5cdFx0XHRcdGhpZGRlbjogdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0fSwgYXN5bmMgKF8sIHJlc3VsdCkgPT4ge1xuXHRcdGlmIChyZXN1bHQucGFzc3dvcmQgIT09IHJlc3VsdC5jb25maXJtUGFzcykge1xuXHRcdFx0Y29uc29sZS5sb2cobWFnZW50YSgnXFxuUGFzc3dvcmRzIGRvIG5vdCBtYXRjaC5cXG5cXG4nKSk7XG5cdFx0XHRjcmVhdGVQd2QoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBDcmVhdGUgbmV3IFNpbXBsZVdhbGxldFxuXHRcdFx0ICogT3BlbiBpdCB0byBhY2Nlc3MgdGhlIG5ldyBBY2NvdW50XG5cdFx0XHQgKiBQcmludCBhY2NvdW50IGluZm9cblx0XHRcdCAqL1xuXHRcdFx0Y29uc3Qgd2FsbGV0ID0gY3JlYXRlU2ltcGxlV2FsbGV0KHJlc3VsdC5wYXNzd29yZCk7XG5cdFx0XHRjb25zdCBwYXNzID0gbmV3IFBhc3N3b3JkKHJlc3VsdC5wYXNzd29yZCk7XG5cdFx0XHRjb25zdCBhY2NvdW50ID0gd2FsbGV0Lm9wZW4ocGFzcyk7XG5cdFx0XHRjb25zdCBhZGRyZXNzID0gYWNjb3VudC5hZGRyZXNzLnByZXR0eSgpO1xuXHRcdFx0Y29uc29sZS5sb2coZ3JlZW4oYCR7TU9TQUlDX05BTUV9IHdhbGxldCBzdWNjZXNzZnVsbHkgY3JlYXRlZC5gKSk7XG5cdFx0XHRjb25zb2xlLmxvZyh3aGl0ZShgWW91IGNhbiBub3cgc3RhcnQgc2VuZGluZyBhbmQgcmVjZWl2aW5nICR7TU9TQUlDX05BTUV9IWApKTtcblx0XHRcdGNvbnNvbGUubG9nKHdoaXRlKGBcXG4ke01PU0FJQ19OQU1FfSBQdWJsaWMgQWRkcmVzczpgKSk7XG5cdFx0XHRjb25zb2xlLmxvZyh5ZWxsb3coYCR7YWRkcmVzc31gKSk7XG5cdFx0XHRjb25zb2xlLmxvZyh3aGl0ZShgXFxuUHJpdmF0ZSBLZXk6YCkpO1xuXHRcdFx0Y29uc29sZS5sb2coeWVsbG93KGAke2FjY291bnQucHJpdmF0ZUtleX1gKSk7XG5cdFx0XHRhd2FpdCBkb3dubG9hZFdhbGxldCh3YWxsZXQpO1xuXHRcdH1cblx0fSlcbn07XG5cbi8qKlxuICogR2V0IHVzZXJzIHBhc3N3b3JkIGFuZCBhdHRlbXB0IG9wZW5pbmcgdGhlIHdhbGxldFxuICovXG5jb25zdCBhdHRlbXB0V2FsbGV0T3BlbiA9ICh3YWxsZXQ6IFNpbXBsZVdhbGxldCk6IFByb21pc2U8QWNjb3VudD4gPT4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2U8QWNjb3VudD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdHByb21wdC5tZXNzYWdlID0gd2hpdGUoJ3dhbGxldCBsb2dpbicpO1xuXHRcdHByb21wdC5zdGFydCgpO1xuXHRcdHByb21wdC5nZXQoe1xuXHRcdFx0cHJvcGVydGllczoge1xuXHRcdFx0XHRwYXNzd29yZDoge1xuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiB3aGl0ZSgnUGFzc3dvcmQnKSxcblx0XHRcdFx0XHRoaWRkZW46IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sIChfLCByZXN1bHQpID0+IHtcblx0XHRcdGNvbnN0IHBhc3MgPSBuZXcgUGFzc3dvcmQocmVzdWx0LnBhc3N3b3JkKTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJlc29sdmUod2FsbGV0Lm9wZW4ocGFzcykpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlZChgJHtlcnJ9YCkpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyh3aGl0ZSgnUGxlYXNlIHRyeSBhZ2FpbicpKTtcblx0XHRcdFx0cmVqZWN0KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBMb2FkIHdhbGxldCBmcm9tIGZpbGUgc3lzdGVtXG4gKi9cbmNvbnN0IGxvYWRXYWxsZXQgPSAoKTogU2ltcGxlV2FsbGV0ID0+IHtcblx0Y29uc3QgY29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoUEFUSF9XQUxMRVQpO1xuXHRyZXR1cm4gU2ltcGxlV2FsbGV0LnJlYWRGcm9tV0xUKGNvbnRlbnRzKTtcbn07XG5cbi8qKlxuICogVGFsayB0byBORU0gQVBJIHRvIGZldGNoIHRoZSBtb3NhaWMgYmFsYW5jZSAmIFhFTSBiYWxhbmNlXG4gKi9cbmNvbnN0IHByaW50QmFsYW5jZSA9IGFzeW5jIChvbkJhbGFuY2U6IChiYWxhbmNlOiBudW1iZXIpID0+IHZvaWQpID0+IHtcblx0Y29uc3Qgd2FsbGV0ID0gbG9hZFdhbGxldCgpO1xuXHR0cnkge1xuXHRcdGNvbnN0IGFjY291bnQgPSBhd2FpdCBhdHRlbXB0V2FsbGV0T3Blbih3YWxsZXQpO1xuXHRcdHNlbGVjdGVkQWNjb3VudCA9IGFjY291bnQ7XG5cdFx0Y29uc29sZS5sb2coJ1xcbicpO1xuXHRcdGNvbnNvbGUubG9nKGBcXG4ke3doaXRlKCdQdWJsaWMgQWRkcmVzczonKX0gJHt3aGl0ZShhY2NvdW50LmFkZHJlc3MucHJldHR5KCkpfVxcbmApO1xuXHRcdGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcih5ZWxsb3coJ0ZldGNoaW5nIGJhbGFuY2UuLi4gJXMnKSk7XG5cdFx0c3Bpbm5lci5zZXRTcGlubmVyU3RyaW5nKDApO1xuXHRcdHNwaW5uZXIuc3RhcnQoKTtcblx0XHRjb25zdCBiYWxhbmNlcyA9IGF3YWl0IGdldEFjY291bnRCYWxhbmNlcyhhY2NvdW50KTtcblx0XHRjb25zdCBtb3NhaWMgPSBhd2FpdCBtb3NhaWNCYWxhbmNlKGJhbGFuY2VzKTtcblx0XHRjb25zdCB4ZW0gPSBhd2FpdCB4ZW1CYWxhbmNlKGJhbGFuY2VzKTtcblx0XHRzcGlubmVyLnN0b3AoKTtcblx0XHQvKipcblx0XHQgKiBDb252ZXJ0IHJhdyBudW1iZXIgaW50byB1c2VyLXJlYWRhYmxlIHN0cmluZ1xuXHRcdCAqIDFlNiBpcyBTY2llbnRpZmljIE5vdGF0aW9uIC0gYWRkcyB0aGUgZGVjaW1hbCBzaXhcblx0XHQgKiBwbGFjZXMgZnJvbSB0aGUgcmlnaHQ6IGllIDE1NjM0OTg3NiA9PiAxNTYuMzQ5ODc2XG5cdFx0ICovXG5cdFx0Y29uc3QgYmFsID0gKG1vc2FpYyAvIDFlNikudG9TdHJpbmcoKTtcblx0XHRjb25zdCB4ZW1CYWwgPSAoeGVtIC8gMWU2KS50b1N0cmluZygpO1xuXHRcdGNvbnNvbGUubG9nKCdcXG4nKTtcblx0XHRjb25zb2xlLmxvZyhgXFxuJHt3aGl0ZSgnWEVNIEJhbGFuY2U6Jyl9ICR7d2hpdGUoeGVtQmFsKX1gKTtcblx0XHRjb25zb2xlLmxvZyhgXFxuJHt3aGl0ZShgJHtNT1NBSUNfTkFNRX0gQmFsYW5jZTpgKX0gJHt3aGl0ZShiYWwpfVxcbmApO1xuXHRcdG9uQmFsYW5jZShtb3NhaWMgLyAxZTYpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdH1cblx0fVxufTtcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50IGZvciB3YWxsZXRcbiAqL1xuY29uc3QgbWFpbiA9IGFzeW5jICgpID0+IHtcblx0aWYgKGFyZ3NbMF0gPT09ICd3YWxsZXQnKSB7XG5cdFx0aWYgKGFyZ3NbMV0gPT09ICdjcmVhdGUnKSB7XG5cdFx0XHRjcmVhdGVQd2QoKTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0LyoqXG5cdFx0ICogSWYgdGhlIGRlZmF1bHQgd2FsbGV0IGZpbGUgaXMgbm90IGluIHRoZSBjb3JyZWN0IHBhdGhcblx0XHQgKiB0aHJvdyBhbiBlcnJvclxuXHRcdCAqL1xuXHRcdGlmICghZnMuZXhpc3RzU3luYyhQQVRIX1dBTExFVCkpIHtcblx0XHRcdGNvbnN0IGZpbGUgPSBgJHtNT1NBSUNfTkFNRX0td2FsbGV0LndsdGA7XG5cdFx0XHRjb25zb2xlLmxvZyhyZWQoYENhbm5vdCBmaW5kIGRlZmF1bHQgd2FsbGV0LiBQbGVhc2UgcGxhY2UgYSBmaWxlIG5hbWVkICR7d2hpdGUoZmlsZSl9IGF0IHRoaXMgbG9jYXRpb246ICR7UEFUSF9XQUxMRVR9YCkpO1xuXHRcdFx0cHJvY2Vzcy5leGl0KDEpO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIEZldGNoIGFuZCBkaXNwbGF5IHRoZSB3YWxsZXQgYmFsYW5jZVxuXHRcdCAqL1xuXHRcdGlmIChhcmdzWzBdID09PSAnYmFsYW5jZScpIHtcblx0XHRcdGF3YWl0IHByaW50QmFsYW5jZShfID0+IHt9KTtcblx0XHR9IGVsc2UgaWYgKGFyZ3NbMF0gPT09ICdzZW5kJykge1xuXHRcdFx0LyoqXG5cdFx0XHQgKiBNYW5hZ2UgdXNlciBpbnB1dCBmb3Igc2VuZGluZyBtb3NhaWMgdG8gYW5vdGhlciB3YWxsZXRcblx0XHRcdCAqIHByaW50QmFsYW5jZSBmb3IgdXNlciBjb252ZW5pZW5jZVxuXHRcdFx0ICovXG5cdFx0XHRhd2FpdCBwcmludEJhbGFuY2UoYXN5bmMgKGJhbGFuY2UpID0+IHtcblx0XHRcdFx0Y29uc3QgYW10ID0gcGFyc2VGbG9hdChhcmdzWzFdKTtcblx0XHRcdFx0Y29uc3QgYWRkcmVzcyA9IGFyZ3NbMl07XG5cdFx0XHRcdGlmIChpc05hTihhbXQpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmVkKCdNdXN0IHByb3ZpZGUgYSB2YWxpZCBudW1iZXIgd2l0aCBtYXhpbXVtIG9mIDYgZGlnaXRzIGllIDEwLjM1Njc4NCcpKTtcblx0XHRcdFx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFhZGRyZXNzKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmVkKCdNdXN0IHByb3ZpZGUgYSB2YWxpZCByZWNpcGllbnQgYWRkcmVzcycpKTtcblx0XHRcdFx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgIChhbXQgPiBiYWxhbmNlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmVkKGBZb3UgZG9uJ3QgaGF2ZSBlbm91Z2ggJHtNT1NBSUNfTkFNRX0gdG8gc2VuZGApKTtcblx0XHRcdFx0XHRwcm9jZXNzLmV4aXQoMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCBwcmVUcmFuc2FjdGlvbiA9IGF3YWl0IHByZXBhcmVUcmFuc2ZlcihhZGRyZXNzLCBhbXQpO1xuXHRcdFx0XHRcdGNvbnN0IHhlbUZlZSA9IChwcmVUcmFuc2FjdGlvbi5mZWUgLyAxZTYpLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cod2hpdGUoJ1RyYW5zYWN0aW9uIERldGFpbHM6IFxcbicpKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgUmVjaXBpZW50OiAgICAgICAgICAke3llbGxvdyhhZGRyZXNzKX1cXG5gKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgJHtNT1NBSUNfTkFNRX0gdG8gc2VuZDogICAgICAke3llbGxvdyhhbXQudG9TdHJpbmcoKSl9XFxuYCk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFhFTSBGZWU6ICAgICAgICAgICAgJHt5ZWxsb3coeGVtRmVlKX1cXG5cXG5gKTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgJHt3aGl0ZSgnV291bGQgeW91IGxpa2UgdG8gcHJvY2VlZD9cXG4nKX1gKTtcblxuXHRcdFx0XHRcdHByb21wdC5tZXNzYWdlID0gd2hpdGUoYCR7TU9TQUlDX05BTUV9IFRyYW5zZmVyYCk7XG5cdFx0XHRcdFx0cHJvbXB0LnN0YXJ0KCk7XG5cdFx0XHRcdFx0cHJvbXB0LmdldCh7XG5cdFx0XHRcdFx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdFx0XHRcdGNvbmZpcm1hdGlvbjoge1xuXHRcdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiB5ZWxsb3coJ1Byb2NlZWQ/ICggeS9uICknKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSwgYXN5bmMgKF8sIHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHJlc3VsdC5jb25maXJtYXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ3knIHx8IHJlc3VsdC5jb25maXJtYXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ3llcycpIHtcblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBzZW5kTW9zYWljKGFkZHJlc3MsIGFtdCwgc2VsZWN0ZWRBY2NvdW50KTtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhyZXN1bHQpO1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdcXG5cXG4nKTtcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyh3aGl0ZSgnVHJhbnNhY3Rpb24gc3VjY2Vzc2Z1bGx5IGFubm91bmNlZCB0byB0aGUgTkVNIGJsb2NrY2hhaW4uIFRyYW5zYWN0aW9uIGNvdWxkIHRha2Ugc29tZSB0aW1lLiBDb21lIGJhY2sgaGVyZSBpbiA1IG1pbnV0ZXMgdG8gY2hlY2sgeW91ciBiYWxhbmNlIHRvIGVuc3VyZSB0aGF0IHRoZSB0cmFuc2FjdGlvbiB3YXMgc3VjY2Vzc2Z1bGx5IHNlbnRcXG4nKSk7XG5cblx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2cocmVkKGVycikpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnVHJhbnNhY3Rpb24gY2FuY2VsZWQnKTtcblx0XHRcdFx0XHRcdFx0cHJvY2Vzcy5leGl0KDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgXFxuJHtlcnJ9XFxuYCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufTtcblxubWFpbigpO1xuXG5wcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIGZ1bmN0aW9uKGVycikge1xuXHRjb25zb2xlLmxvZyhlcnIpO1xuXHRjb25zb2xlLmxvZygnV2FsbGV0IGNsb3NlZCcpO1xuXHRwcm9jZXNzLmV4aXQoMSk7XG59KTsiXX0=