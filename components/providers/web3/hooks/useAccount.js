import { useEffect, useState, useContext } from "react";
import useSWR from "swr";
import { Web3Context } from "/var/www/html/Defi-Lending-Borrowing/components/hooks/web3/web3Context.js"; 

export const useAccount = () => {
  const { web3, provider } = useContext(Web3Context);

  // Trạng thái để theo dõi xem có tài khoản nào được kết nối hay không
  const [hasAccount, setHasAccount] = useState(false);

  // Hàm để lấy địa chỉ tài khoản Ethereum, trả về null nếu không có tài khoản nào
  const getAccounts = async () => {
    if (!web3) {
      return null; 
    }

    const accounts = await web3.eth.getAccounts();
    return accounts.length > 0 ? accounts[0] : null; 
  };

  // Sử dụng useSWR để fetch và cache dữ liệu tài khoản
  const { data, mutate, error, ...rest } = useSWR("web3/account", getAccounts, {
    revalidateOnFocus: false, // Không tự động refetch khi chuyển đổi tab
    onSuccess: (account) => {
      setHasAccount(!!account); // Cập nhật trạng thái khi có tài khoản
    },
    onError: (error) => {
      console.error("Error fetching account:", error);
      setHasAccount(false); // Đặt lại trạng thái khi có lỗi
    },
  });

  // Xử lý sự kiện "accountsChanged" để cập nhật khi tài khoản thay đổi
  useEffect(() => {
    if (!provider) return; // Thoát sớm nếu không có provider

    const handleAccountsChanged = async (accounts) => {
      const newAccount = await getAccounts();
      mutate(newAccount, false); // Cập nhật SWR cache mà không refetch
    };

    provider.on("accountsChanged", handleAccountsChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [provider, mutate]);

  return {
    account: data,
    mutate,
    error,
    hasAccount,
    isLoading: !error && !data,
    isError: !!error,
    ...rest,
  };
};
