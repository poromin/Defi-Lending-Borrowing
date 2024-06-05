// _app.js
import { Web3Provider } from "/var/www/html/Defi-Lending-Borrowing/components/hooks/web3/web3Context.js";
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return(
      <Web3Provider> 
        <Component {...pageProps} />
      </Web3Provider>
  )
}

export default MyApp
