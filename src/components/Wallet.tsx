import React from 'react';

import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import ERC20_ABI from "../ERC20_ABI.json";

const CONTRACT_HASH = '0x867822252905297Eb5524021d882464c3929b84f';

export const Wallet = () => {
    const [selectedAddress, setSelectedAddress] = React.useState<null | string>(null);
    const [balance, setBalance] = React.useState<null | string>(null);
    const [tokenData, setTokenData] = React.useState<any>({ tokenName: null, block: null, tokenBalance: null, tokenBalanceInEther: null });

    const [sentToData, setSentToData] = React.useState<any>({ address: '', amountInEther: '' });

    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [isTransactionInProgress, setIsTransactionInProgress] = React.useState<boolean>(false);


    React.useEffect(() => {
        window.ethereum.on("message", (message) => {
            console.log(message);
        });

    }, []);

    const getAddressBalances = async (provider: any, address: string) => {
        try {
            const balance = await provider.getBalance(address); // get user balance
            const balanceInEther = ethers.utils.formatEther(balance); // convert balance into eth
            setBalance(balanceInEther);

            const anonContract = new ethers.Contract(CONTRACT_HASH, ERC20_ABI, provider);
            const tokenName = await anonContract.name();
            const tokenBalance = await anonContract.balanceOf(address); // balance of user in token
            const tokenCount = new BigNumber(tokenBalance._hex, 16);

            const tokenUnits = await anonContract.decimals();
            const tokenBalanceInEther = ethers.utils.formatUnits(tokenBalance, tokenUnits);
            setTokenData({ tokenName, tokenBalance: tokenCount.toFormat(3), tokenBalanceInEther })

        } catch (e) {
            console.error(e);

        }

    }


    const connectToMetamask = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setSelectedAddress(accounts[0]);

        getAddressBalances(provider, accounts[0]);
    }

    const sendTo = async ({ to, amountInEther, tokens }: { to: string, amountInEther: number, tokens: string }) => {
        setIsLoading(true);
        try {
            if (!to || typeof amountInEther === 'number' || amountInEther <= 0) {
                alert("Please provide a valid amount and address");
                return;
            }
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner()

            const anonContract = new ethers.Contract(CONTRACT_HASH, ERC20_ABI, provider);

            const tokenUnits = await anonContract.decimals();
            const tokenAmountInEther = ethers.utils.parseUnits(`${amountInEther}`, tokenUnits);

            const anonContractWithSigner = anonContract.connect(signer);
            const transaction = await anonContractWithSigner.transfer(to, tokenAmountInEther);
            setIsTransactionInProgress(true);
            await transaction.wait();
            setSentToData({ address: '', amountInEther: '' });
            setIsLoading(false);
            setIsTransactionInProgress(false);

            getAddressBalances(provider, selectedAddress || '');
        } catch (e) {
            console.error(e);
            setIsLoading(false);
            setIsTransactionInProgress(false);
        }
    }

    const renderMetamask = () => {
        if (!selectedAddress) {
            return (
                <button onClick={connectToMetamask}>Connect to Metamask</button>
            )
        }

        return (
            <div>
                <p className="glowing-text">{selectedAddress}</p>
                <p>Your ETH Balance is: {balance}</p>
                <p>Balance of {tokenData.tokenName} is: {tokenData.tokenBalance}</p>
                <p>Token balance in ETH: {tokenData.tokenBalanceInEther}</p>
            </div>
        );
    }

    const renderSentTokenForm = () => {
        return (
            <form onSubmit={(e) => { e.preventDefault(); sendTo({ to: sentToData.address, amountInEther: sentToData.amountInEther, tokens: '' }); }}>
                <div className="form-group">
                    <h3>Send token to another address</h3>
                    <input type="text" placeholder="Address" value={sentToData.address} onChange={(e) => setSentToData({ ...sentToData, address: e.target.value })} />
                    <input type="number" placeholder="Amount in Eth" value={sentToData.amountInEther} onChange={(e) => setSentToData({ ...sentToData, amountInEther: e.target.value })} />
                    <div>
                        <button type='submit'>Send token</button>
                    </div>
                </div>
            </form>
        )
    }


    return (
        <div>
            {isLoading && <div className="loader-container">
                <div className={`spinner ${(isTransactionInProgress && 'trans-spinner') || ''}`}></div>
                <h4>{isTransactionInProgress ? 'Transaction in progress...' : 'Confirmation your transaction...'}</h4>
            </div>}
            {renderMetamask()}
            {!!selectedAddress && renderSentTokenForm()}
        </div>
    )

};