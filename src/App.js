import "./App.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import usdcAbi from "./contractAbi.json";

// const USDCTokenAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
const USDCTokenAddress = "0x3562835A4606712b217630500735bC791Bd7477D";
const MultiFaucetAddress = "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b";

function App() {
  const [provider, setProvider] = useState();
  const [currentUserAddress, setCurrentUserAddress] = useState();
  const [userBalance, setUserBalance] = useState();
  const [userUSDCBalance, setUserUSDCBalance] = useState();
  const [approvedMultiFacuetUSDC, setApprovedMutliFausetUSDC] = useState();

  const [txnUser, setTxnUser] = useState({
    amount: "0",
    recieverAddress: "",
  });

  const [appActive, setAppActive] = useState(true);

  const [currentNetwork, setCurrentNetwork] = useState();

  const [usdcContract, setUsdcContract] = useState();

  const [isTxnPending, setTxnPending] = useState(false);

  useEffect(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      const usdcContract = new ethers.Contract(
        USDCTokenAddress,
        usdcAbi,
        signer
      );

      setCurrentNetwork(network);
      setProvider(provider);
      setCurrentUserAddress(await signer.getAddress());
      setUsdcContract(usdcContract);
    })();
  }, []);

  const handleGetBalance = (address) => {
    // console.log(address.getAddress())
    provider !== undefined &&
      provider.getBalance(address).then((balance) => {
        // convert a currency unit from wei to ether
        const balanceInEth = ethers.utils.formatEther(balance);
        setUserBalance(balanceInEth);
      });
  };

  const handleBalancesFetch = async () => {
    if (usdcContract !== undefined) {
      // const supply = await usdcContract.totalSupply();
      const userBalance = await usdcContract.balanceOf(currentUserAddress);
      const approvedMultiFacuetUSDC = await usdcContract.allowance(
        currentUserAddress,
        MultiFaucetAddress
      );
      setUserUSDCBalance(userBalance.toString());
      setApprovedMutliFausetUSDC(approvedMultiFacuetUSDC.toString());
    }
  };

  useEffect(() => {
    // Goerli Test Network Chain ID is 5.
    if (currentNetwork && currentNetwork.chainId !== 5) {
      // freeze
      setAppActive(false);
    } else {
      setAppActive(true);
    }
    currentUserAddress && handleGetBalance(currentUserAddress);
    handleBalancesFetch();

    window.ethereum.on("chainChanged", (chainId) => {
      //  Can do alot fo optimizations but reloading is better for short term
      window.location.reload();
    });
  });

  const handleApprove = async () => {
    const amt = parseInt(txnUser.amount);

    try {
      if (usdcContract !== undefined) {
        const tx = await usdcContract.approve(MultiFaucetAddress, amt);
        toast(`Transaction Sent.. with Hash ${tx.hash}`);
        setTxnPending(true);
        const res = await tx.wait();
        if (res.status === 1) {
          toast("Transaction was successful");
        } else {
          toast("Something Bad Happened!!");
        }
        setTxnPending(false);
      } else {
        alert("USDC Contract not Init.");
      }
    } catch (e) {
      if (e.code && e.code === 4001) {
        toast("User Denied Txn.!!");
      } else {
        toast("Some Error Occured!!");
      }
      setTxnPending(false);
    }
  };

  const handleSend = async () => {
    const amt = parseInt(txnUser.amount);
    const reciever = txnUser.recieverAddress;

    if (reciever.startsWith("0x")) {
      const code = await provider.getCode(reciever);
      if (code !== "0x") {
        toast("Looks like it's a contract address.");
      } else {
        toast("Wohoo, It's a user Address");
      }

      try {
        if (usdcContract !== undefined) {
          const tx = await usdcContract.transfer(reciever, amt);
          toast(`Transaction Sent.. with Hash ${tx.hash}`);
          setTxnPending(true);
          const res = await tx.wait();
          if (res.status === 1) {
            toast("Transaction was successful");
          } else {
            toast("Something Bad Happened!!");
          }
          setTxnPending(false);
        } else {
          alert("USDC Contract not Init.");
        }
      } catch (e) {
        if (e.code && e.code === 4001) {
          toast("User Denied Txn.!!");
        } else {
          toast("Some Error Occured!!");
        }
        setTxnPending(false);
      }
    } else {
      toast("Please Provide a Hex Address Starting with 0x");
    }
  };

  return appActive ? (
    <div style={{ padding: "20px" }}>
      <ToastContainer />
      <div>
        <p>Ether Balance: {userBalance} ETH</p>
      </div>

      <div>
        <p>USDC Address: {USDCTokenAddress}</p>
        <p>USDC Balance: {userUSDCBalance} USDC</p>
      </div>

      <div>
        <p>MultiFaucet Address: {MultiFaucetAddress}</p>
        <p>Allowed USDC for Multifaucet: {approvedMultiFacuetUSDC} USDC </p>
      </div>

      <div>
        <input
          placeholder="Set Amount for MultiFaucet Approved USDC Tokens"
          type="number"
          value={txnUser.amount}
          onChange={(e) => setTxnUser({ ...txnUser, amount: e.target.value })}
        />
        <button onClick={handleApprove}>Approve</button>
      </div>

      <div>
        <p>Send USDC Token to:</p>
        <input
          placeholder="Reciever Address"
          value={txnUser.recieverAddress}
          onChange={(e) =>
            setTxnUser({ ...txnUser, recieverAddress: e.target.value })
          }
        />
        <input
          placeholder="Tokens to Send"
          type="number"
          value={txnUser.amount}
          onChange={(e) => setTxnUser({ ...txnUser, amount: e.target.value })}
        />
        <button onClick={handleSend}>Send</button>
      </div>
      <p>
        {isTxnPending &&
          "Looks like a Tranasaction is Pending Please do wait..."}
      </p>
    </div>
  ) : (
    <h3>
      Looks like you are not connected to Goerli Testnet. Please Connect to that
      network only.
    </h3>
  );
}

export default App;
