/**
 * **记账 Loon 脚本
 * @author: lizhengbo
 * 更新地址：https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js
 * 
 * 功能：
 * √ 拦截用户配置接口，修改会员等级为VIP
 * √ 拦截应用配置接口，修改配置值为999
 * √ 拦截用户账户状态接口，修改会员等级为VIP
 * 
 * 配置：
 * 1️⃣ 在 Loon 插件或脚本配置中添加
 * [MITM]
 * hostname = api.heylumi.cn
 * [Script]
 * http-response ^https:\/\/api\.heylumi\.cn\/note\/note-api\/settings\/profile\/get script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true, tag=Kapi-Profile-Get
 * http-response ^https:\/\/api\.heylumi\.cn\/note\/note-api\/common\/app\/config\/list script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true, tag=Kapi-App-Config-List
 * http-response ^https:\/\/api\.heylumi\.cn\/note\/note-api\/user\/account\/status script-path=https://raw.githubusercontent.com/Lizhengbo0304/qx_boxjs/refs/heads/main/kapi-accounting.js, requires-body=true, tag=Kapi-Account-Status
 * 
 * 注意：此脚本会自动拦截**记账的API响应并修改数据，无需额外配置。
 */

const url = $request.url;
let body = $response.body;

try {
    // 解析响应数据
    let data = JSON.parse(body);
    
    // API1: 用户配置信息接口
    if (url.includes('/note/note-api/settings/profile/get')) {
        console.log('拦截到用户配置接口，开始修改数据...');
        
        if (data && data.data && data.data.userRightsAccount) {
            // 修改会员等级为VIP
            data.data.userRightsAccount.memberLevel = "VIP";
            data.data.userRightsAccount.vipLevel = "VIP";
            
            // 修改到期时间为2099年
            data.data.userRightsAccount.endTime = "2099-12-31 23:59:59";
            
            console.log('用户配置数据修改完成');
            console.log('memberLevel:', data.data.userRightsAccount.memberLevel);
            console.log('vipLevel:', data.data.userRightsAccount.vipLevel);
            console.log('endTime:', data.data.userRightsAccount.endTime);
        }
    }
    
    // API2: 应用配置列表接口
    else if (url.includes('/note/note-api/common/app/config/list')) {
        console.log('拦截到应用配置接口，开始修改数据...');
        
        if (data && data.dataList && Array.isArray(data.dataList)) {
            // 遍历配置列表，将所有value修改为999
            data.dataList.forEach((item, index) => {
                if (item && typeof item.value !== 'undefined') {
                    const originalValue = item.value;
                    item.value = 999;
                    console.log(`配置项 ${index + 1}: ${item.code} - 原值: ${originalValue} -> 新值: ${item.value}`);
                }
            });
            
            console.log(`应用配置数据修改完成，共修改了 ${data.dataList.length} 个配置项`);
        }
    }
    
    // API3: 用户账户状态接口
    else if (url.includes('/note/note-api/user/account/status')) {
        console.log('拦截到用户账户状态接口，开始修改数据...');
        
        if (data && data.data) {
            // 修改会员等级为VIP
            data.data.memberLevel = "VIP";
            data.data.vipLevel = "VIP";
            
            // 修改到期时间为2099年
            data.data.endTime = "2099-12-31 23:59:59";
            
            console.log('用户账户状态数据修改完成');
            console.log('memberLevel:', data.data.memberLevel);
            console.log('vipLevel:', data.data.vipLevel);
            console.log('endTime:', data.data.endTime);
        }
    }
    
    // 返回修改后的数据
    body = JSON.stringify(data);
    
} catch (error) {
    console.log('数据解析或修改出错:', error);
    console.log('原始响应数据:', body);
}

$done({ body });