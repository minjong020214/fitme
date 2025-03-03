import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import BootPay from 'bootpay-js';
import Swal from 'sweetalert2';

function Payment(props) {
  
  const [myCookieValue, setMyCookieValue] = useState('');
  console.log('totalAmount:', props.totalAmount);
  console.log('props.productNames:', props.productNames);
  console.log('productNames:', props.productNames ? props.productNames.join(', ') : 'No product names available');

  useEffect(() => {
    const getCookie = (name) => {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    };
    setMyCookieValue(getCookie('Authorization'));

    BootPay.setApplicationId('65e7fca2d25985001b6e5d69');

    return () => {
      BootPay.removePaymentWindow();
    };
  }, []);

  const generatePayNo = () => {
    const timestamp = new Date().getTime();
    return parseInt(timestamp.toString().substr(5));
  };
  
  const generateOrderId = () => {
    return 'order_' + new Date().getTime();
  };

  const openBootPay = (orderId, payNo) => {
    BootPay.request({
      price: props.totalAmount,
      application_id: '65e7fca2d25985001b6e5d69',
      name: props.productNames.join(', '), // 상품명을 사용
      pg: '',
      order_id: orderId,
      use_order_id: true,
      account_id: props.accountNo,
      methods: ['card', 'phone', 'bank', 'vbank'],
      extras: {},
    }).error(function (data) {
      console.error(data);
      console.log('결제 에러가 발생했습니다.');
    }).cancel(function (data) {
      console.log(data);
      console.log('결제가 취소되었습니다.');
    }).ready(function (data) {
      console.log(data);
    }).confirm(function (data) {
      console.log(data); // 여기서 사용자가 선택한 결제 수단을 확인
      var enable = true;
      if (enable) {
        BootPay.transactionConfirm(data);
      } else {
        BootPay.removePaymentWindow();
      }
    }).done(function (data) {
      console.log(data);
      console.log('결제가 완료되었습니다.');
      sendPaymentData(payNo, data.method); // 결제 수단을 전달
      Swal.fire({
        icon: 'success',
        title: '결제 완료',
        text: '결제가 완료되었습니다.'
      });
    });    
  };
  

  const sendPaymentData = async (payNo, payMethod) => {
    try {
      console.log('payMethod : ',payMethod);
      const formData = {
        payNo: payNo,
        payType: 'C',
        payName:  props.productNames.join(', '), // 상품명을 전달
        payPrice: props.totalAmount,
        payMethod: payMethod, 
        payDate: ''
      };
      
      const response = await axios.post('http://192.168.0.53:8080/api/v1/payment/insert', formData, {
        headers: {
          'Authorization': `${myCookieValue}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('결제 정보 저장 성공', response);
    } catch (error) {
      console.log('결제 정보 저장 실패', error);
      console.log('실패: 결제 정보를 저장하지 못했습니다.');
      Swal.fire({
        icon: 'error',
        title: '결제 실패',
        text: '결제가 실패되었습니다.'
      });
    }
  };

  const payListInsert = async () => {
    const payNo = generatePayNo();
    const orderId = generateOrderId();
    openBootPay(orderId, payNo);
  };

  return (
    <Button onClick={payListInsert} variant="contained" color="primary" style={{backgroundColor:'#F8A532',width: '200px' }}>주문하기</Button>
  );
}

export default Payment;
