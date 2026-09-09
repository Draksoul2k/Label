import{a as H}from"./chunk-TJA5EIY7.js";import{b as U,d as Q,f as Y,k as Z,l as X,m as J,r as tt}from"./chunk-2GX3RTCB.js";import{a as V,b as nt}from"./chunk-6YYDUHY6.js";import{a as et}from"./chunk-RXTH2VEI.js";import{$a as m,Ab as h,Bb as k,Cb as a,Db as u,Ea as o,Eb as E,Fb as F,Hb as G,Ib as T,Jb as P,Kb as B,Qb as g,Ra as L,Rb as y,S as N,Sb as b,X as _,Y as x,Z as A,_ as w,ab as p,cb as j,db as M,eb as D,fb as S,gb as e,hb as n,ib as f,lc as z,mc as W,nc as K,pb as v,rb as C,tb as c,vb as I,wb as q,xb as R}from"./chunk-JAIA4NYE.js";import"./chunk-JSSFPNKJ.js";var at=["revenueChart"],ot=["usersChart"],rt=["usageChart"],it=(i,d)=>d.id,lt=(i,d)=>d.organizationId,dt=(i,d)=>d.key;function ct(i,d){if(i&1){let t=v();e(0,"div",3)(1,"button",9),C("click",function(){_(t);let r=c();return x(r.setTab("requests"))}),e(2,"span",10),A(),e(3,"svg",11),f(4,"path",12)(5,"polyline",13)(6,"line",14)(7,"line",15),n()(),w(),e(8,"span",16)(9,"span",17),a(10,"Ch\u1EDD x\xE1c nh\u1EADn"),n(),e(11,"span",18),a(12),g(13,"number"),e(14,"small"),a(15,"\u0111\u01A1n"),n()()()(),e(16,"button",9),C("click",function(){_(t);let r=c();return x(r.setTab("expiring"))}),e(17,"span",10),A(),e(18,"svg",11),f(19,"circle",19)(20,"polyline",20),n()(),w(),e(21,"span",16)(22,"span",17),a(23,"S\u1EAFp h\u1EBFt h\u1EA1n \xB7 14 ng\xE0y"),n(),e(24,"span",18),a(25),g(26,"number"),e(27,"small"),a(28,"kh\xE1ch"),n()()()(),e(29,"button",21),C("click",function(){_(t);let r=c();return x(r.setTab("users"))}),e(30,"span",10),A(),e(31,"svg",11),f(32,"path",22)(33,"path",23)(34,"path",24)(35,"line",25)(36,"line",26),n()(),w(),e(37,"span",16)(38,"span",17),a(39,"T\u1ED5 ch\u1EE9c"),n(),e(40,"span",18),a(41),g(42,"number"),e(43,"small"),a(44),g(45,"number"),n()()()(),e(46,"button",27),C("click",function(){_(t);let r=c();return x(r.setTab("reports"))}),e(47,"span",10),A(),e(48,"svg",11),f(49,"line",28)(50,"path",29),n()(),w(),e(51,"span",16)(52,"span",17),a(53,"Doanh thu th\xE1ng"),n(),e(54,"span",18),a(55),g(56,"number"),e(57,"small"),a(58,"\u0111"),n()()()()()}if(i&2){let t=d,l=c();o(),h("tone-work",t.pendingRequests>0)("is-idle",!t.pendingRequests)("is-active",l.tab==="requests"),o(11),u(y(13,21,t.pendingRequests)),o(4),h("tone-warn",t.expiringSoon>0)("is-idle",!t.expiringSoon)("is-active",l.tab==="expiring"),o(9),u(y(26,23,t.expiringSoon)),o(4),h("is-active",l.tab==="users"),o(12),u(y(42,25,t.totalOrganizations)),o(3),E("\xB7 ",y(45,27,t.totalUsers)," ng\u01B0\u1EDDi d\xF9ng"),o(2),h("is-active",l.tab==="reports"),o(9),u(y(56,29,t.mrr))}}function st(i,d){if(i&1&&(e(0,"span",6),a(1),n()),i&2){let t=c();o(),u(t.pendingCount)}}function ut(i,d){if(i&1&&(e(0,"span",6),a(1),n()),i&2){let t=c();o(),u(t.expiringCount)}}function mt(i,d){if(i&1){let t=v();e(0,"button",40),C("click",function(){_(t);let r=c(3);return x(r.setRequestFilter("all"))}),a(1,"Xem t\u1EA5t c\u1EA3 \u0111\u01A1n"),n()}}function pt(i,d){if(i&1&&(e(0,"div",34)(1,"div",36),A(),e(2,"svg",37),f(3,"polyline",38),n()(),w(),e(4,"h4"),a(5),n(),e(6,"p"),a(7,"Khi kh\xE1ch h\xE0ng g\u1EEDi y\xEAu c\u1EA7u \u0111\u0103ng k\xFD g\xF3i, \u0111\u01A1n s\u1EBD xu\u1EA5t hi\u1EC7n t\u1EA1i \u0111\xE2y k\xE8m m\xE3 \u0111\u01A1n \u0111\u1EC3 \u0111\u1ED1i chi\u1EBFu v\u1EDBi tin nh\u1EAFn Zalo OA."),n(),m(8,mt,2,0,"button",39),n()),i&2){let t=c(2);o(5),u(t.requestFilter==="pending"?"Kh\xF4ng c\xF2n \u0111\u01A1n n\xE0o ch\u1EDD x\u1EED l\xFD":"Ch\u01B0a c\xF3 y\xEAu c\u1EA7u n\xE0o"),o(3),p(t.requestFilter==="pending"?8:-1)}}function _t(i,d){if(i&1&&(e(0,"div",51),a(1),n()),i&2){let t=c().$implicit,l=c(3);k("adm-age "+l.ageClass(t.createdAt)),o(),u(l.ageText(t.createdAt))}}function xt(i,d){if(i&1&&(e(0,"div",44),a(1),g(2,"date"),n()),i&2){let t=c().$implicit;o(),u(b(2,1,t.createdAt,"dd/MM/yyyy"))}}function Ct(i,d){if(i&1&&(e(0,"div",44),a(1),g(2,"date"),g(3,"date"),n()),i&2){let t=c().$implicit;o(),F("",b(2,2,t.startDate,"dd/MM/yyyy")," \u2192 ",b(3,5,t.endDate,"dd/MM/yyyy"))}}function gt(i,d){if(i&1&&(e(0,"div",44),a(1),g(2,"date"),e(3,"b"),a(4,"gia h\u1EA1n"),n()()),i&2){let t=c().$implicit;o(),F("\u0110ang d\xF9ng ",t.currentPlan," \u0111\u1EBFn ",b(2,2,t.currentEndDate,"dd/MM/yyyy")," \xB7 ")}}function Et(i,d){if(i&1&&(e(0,"div",44),a(1),n()),i&2){let t=c().$implicit;o(),E("\u0110ang d\xF9ng ",t.currentPlan)}}function ht(i,d){if(i&1&&(e(0,"div",47),a(1),n()),i&2){let t=c().$implicit;S("title",t.note),o(),E("\u201C",t.note,"\u201D")}}function ft(i,d){if(i&1&&(e(0,"div",44),a(1),n()),i&2){let t=c().$implicit;o(),u(t.reviewNote)}}function vt(i,d){if(i&1){let t=v();e(0,"button",52),C("click",function(){_(t);let r=c().$implicit,s=c(3);return x(s.openApprove(r))}),a(1,"K\xEDch ho\u1EA1t"),n(),e(2,"button",53),C("click",function(){_(t);let r=c().$implicit,s=c(3);return x(s.openReject(r))}),a(3,"T\u1EEB ch\u1ED1i"),n()}}function bt(i,d){if(i&1&&(e(0,"span",44),a(1),f(2,"br"),a(3),g(4,"date"),n()),i&2){let t=c().$implicit;o(),u(t.reviewedByName),o(2),u(b(4,2,t.reviewedAt,"dd/MM/yyyy"))}}function yt(i,d){if(i&1&&(e(0,"tr")(1,"td")(2,"div",42),a(3),n(),m(4,_t,2,3,"div",43)(5,xt,3,4,"div",44),n(),e(6,"td")(7,"div",45),a(8),n(),e(9,"div",44),a(10),n()(),e(11,"td")(12,"div",45),a(13),n(),e(14,"div",44),a(15),n()(),e(16,"td")(17,"span",46),a(18),n(),a(19),m(20,Ct,4,8,"div",44)(21,gt,5,5,"div",44)(22,Et,2,1,"div",44),m(23,ht,2,2,"div",47),n(),e(24,"td",48),a(25),g(26,"number"),n(),e(27,"td")(28,"span",49),a(29),n(),m(30,ft,2,1,"div",44),n(),e(31,"td",50),m(32,vt,4,0)(33,bt,5,5,"span",44),n()()),i&2){let t=d.$implicit,l=c(3);o(3),u(t.orderCode),o(),p(t.status==="Pending"?4:5),o(4),u(t.company),o(2),u(t.requestedByEmail),o(3),u(t.contactName),o(2),u(t.contactPhone),o(2),k("adm-plan "+l.planClass(t.plan)),o(),u(t.planName),o(),E(" \xB7 ",t.cycleName," "),o(),p(t.startDate?20:t.isRenewal?21:22),o(3),p(t.note?23:-1),o(2),E("",y(26,22,t.amount),"\u20AB"),o(3),h("badge-warning",t.status==="Pending")("badge-success",t.status==="Approved")("badge-muted",t.status==="Rejected"||t.status==="Cancelled"),o(),u(l.statusLabel(t.status)),o(),p(t.reviewNote?30:-1),o(2),p(t.status==="Pending"?32:t.reviewedByName?33:-1)}}function St(i,d){if(i&1&&(e(0,"div",35)(1,"table")(2,"thead")(3,"tr")(4,"th"),a(5,"M\xE3 \u0111\u01A1n"),n(),e(6,"th"),a(7,"Kh\xE1ch h\xE0ng"),n(),e(8,"th"),a(9,"Li\xEAn h\u1EC7"),n(),e(10,"th"),a(11,"G\xF3i & th\u1EDDi h\u1EA1n"),n(),e(12,"th",41),a(13,"S\u1ED1 ti\u1EC1n"),n(),e(14,"th"),a(15,"Tr\u1EA1ng th\xE1i"),n(),f(16,"th"),n()(),e(17,"tbody"),M(18,yt,34,24,"tr",null,it),n()()()),i&2){let t=c(2);o(18),D(t.requests)}}function kt(i,d){if(i&1){let t=v();e(0,"div",7)(1,"div",30)(2,"div")(3,"h3"),a(4,"Y\xEAu c\u1EA7u \u0111\u0103ng k\xFD g\xF3i"),n(),e(5,"p",31),a(6,"Kh\xE1ch g\u1EEDi y\xEAu c\u1EA7u r\u1ED3i thanh to\xE1n qua Zalo OA \u2014 duy\u1EC7t t\u1EA1i \u0111\xE2y \u0111\u1EC3 k\xEDch ho\u1EA1t g\xF3i."),n()(),e(7,"div",32)(8,"button",33),C("click",function(){_(t);let r=c();return x(r.setRequestFilter("pending"))}),a(9,"Ch\u1EDD x\xE1c nh\u1EADn"),n(),e(10,"button",33),C("click",function(){_(t);let r=c();return x(r.setRequestFilter("all"))}),a(11,"T\u1EA5t c\u1EA3"),n()()(),m(12,pt,9,2,"div",34)(13,St,20,0,"div",35),n()}if(i&2){let t=c();o(8),h("active",t.requestFilter==="pending"),o(2),h("active",t.requestFilter==="all"),o(2),p(t.requests.length?13:12)}}function At(i,d){if(i&1){let t=v();e(0,"button",33),C("click",function(){let r=_(t).$implicit,s=c(2);return x(s.setExpiringDays(r))}),a(1),n()}if(i&2){let t=d.$implicit,l=c(2);h("active",l.expiringDays===t),o(),E("",t," ng\xE0y")}}function wt(i,d){if(i&1&&(e(0,"div",34)(1,"div",36),A(),e(2,"svg",37),f(3,"polyline",38),n()(),w(),e(4,"h4"),a(5),n(),e(6,"p"),a(7,"Danh s\xE1ch n\xE0y l\xE0 nh\u1EEFng kh\xE1ch c\u1EA7n g\u1ECDi nh\u1EAFc gia h\u1EA1n. \u0110\u1ED5i m\u1ED1c th\u1EDDi gian \u1EDF tr\xEAn \u0111\u1EC3 nh\xECn xa h\u01A1n."),n()()),i&2){let t=c(2);o(5),E("Kh\xF4ng c\xF3 g\xF3i n\xE0o h\u1EBFt h\u1EA1n trong ",t.expiringDays," ng\xE0y t\u1EDBi")}}function Mt(i,d){if(i&1){let t=v();e(0,"button",53),C("click",function(){_(t);let r=c().$implicit,s=c(3);return x(s.openRenew(r))}),a(1,"Gia h\u1EA1n"),n()}}function Dt(i,d){if(i&1&&(e(0,"tr")(1,"td",45),a(2),n(),e(3,"td")(4,"div",45),a(5),n(),e(6,"div",44),a(7),n()(),e(8,"td"),a(9),n(),e(10,"td")(11,"span",46),a(12),n()(),e(13,"td"),a(14),g(15,"date"),n(),e(16,"td")(17,"span",55),a(18),n()(),e(19,"td",50),m(20,Mt,2,0,"button",56),n()()),i&2){let t=d.$implicit,l=c(3);o(2),u(t.company),o(3),u(t.ownerName),o(2),u(t.ownerEmail),o(2),u(t.ownerPhone||"\u2014"),o(2),k("adm-plan "+l.planClass(t.plan)),o(),u(t.planName),o(2),u(b(15,12,t.endDate,"dd/MM/yyyy")),o(3),k("adm-days "+l.daysClass(t.daysLeft)),o(),E("c\xF2n ",t.daysLeft," ng\xE0y"),o(2),p(t.ownerUserId?20:-1)}}function Ft(i,d){if(i&1&&(e(0,"div",35)(1,"table")(2,"thead")(3,"tr")(4,"th"),a(5,"C\xF4ng ty"),n(),e(6,"th"),a(7,"Ch\u1EE7 t\xE0i kho\u1EA3n"),n(),e(8,"th"),a(9,"\u0110i\u1EC7n tho\u1EA1i"),n(),e(10,"th"),a(11,"G\xF3i"),n(),e(12,"th"),a(13,"H\u1EBFt h\u1EA1n"),n(),e(14,"th"),a(15,"C\xF2n l\u1EA1i"),n(),f(16,"th"),n()(),e(17,"tbody"),M(18,Dt,21,15,"tr",null,lt),n()()()),i&2){let t=c(2);o(18),D(t.expiring)}}function Tt(i,d){if(i&1&&(e(0,"div",7)(1,"div",30)(2,"div")(3,"h3"),a(4,"Kh\xE1ch s\u1EAFp h\u1EBFt h\u1EA1n"),n(),e(5,"p",31),a(6,"G\u1ECDi tr\u01B0\u1EDBc khi g\xF3i h\u1EBFt h\u1EA1n \u2014 qua ng\xE0y h\u1EBFt h\u1EA1n t\xE0i kho\u1EA3n t\u1EF1 chuy\u1EC3n v\u1EC1 g\xF3i Free."),n()(),e(7,"div",32),M(8,At,2,3,"button",54,j),n()(),m(10,wt,8,1,"div",34)(11,Ft,20,0,"div",35),n()),i&2){let t=c();o(8),D(t.expiringWindows),o(2),p(t.expiring.length?11:10)}}function Pt(i,d){if(i&1&&(e(0,"p",31),a(1),g(2,"number"),g(3,"number"),g(4,"number"),g(5,"number"),n()),i&2){let t=d;o(),G("",y(2,4,t.totalUsers)," ng\u01B0\u1EDDi d\xF9ng \xB7 ",y(3,6,t.totalOrganizations)," t\u1ED5 ch\u1EE9c \xB7 ",y(4,8,t.totalBarcodes)," m\xE3 v\u1EA1ch \xB7 ",y(5,10,t.totalTemplates)," m\u1EABu tem")}}function Bt(i,d){i&1&&(e(0,"div",34)(1,"h4"),a(2,"Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng n\xE0o"),n(),e(3,"p"),a(4,"Th\u1EED m\u1ED9t t\u1EEB kh\xF3a kh\xE1c, ho\u1EB7c x\xF3a \xF4 t\xECm ki\u1EBFm \u0111\u1EC3 xem to\xE0n b\u1ED9 danh s\xE1ch."),n()())}function Ot(i,d){i&1&&(e(0,"span",58),a(1,"Admin"),n())}function Vt(i,d){if(i&1&&(a(0),g(1,"date"),e(2,"b"),a(3),g(4,"date"),n(),e(5,"div",44)(6,"span",55),a(7),n()()),i&2){let t=c().$implicit,l=c(3);E(" ",b(1,5,t.planStartDate,"dd/MM/yyyy")," \u2192 "),o(3),u(b(4,8,t.planEndDate,"dd/MM/yyyy")),o(3),k("adm-days "+l.daysClass(l.daysLeft(t.planEndDate))),o(),E("c\xF2n ",l.daysLeft(t.planEndDate)," ng\xE0y")}}function It(i,d){i&1&&(e(0,"span",60),a(1,"Kh\xF4ng gi\u1EDBi h\u1EA1n"),n())}function qt(i,d){if(i&1){let t=v();e(0,"tr")(1,"td")(2,"div",45),a(3),m(4,Ot,2,0,"span",58),n(),e(5,"div",44),a(6),n()(),e(7,"td"),a(8),n(),e(9,"td")(10,"span",59),a(11),n()(),e(12,"td")(13,"span",46),a(14),n()(),e(15,"td"),m(16,Vt,8,11)(17,It,2,0,"span",60),n(),e(18,"td",48),a(19),n(),e(20,"td"),a(21),g(22,"date"),n(),e(23,"td",50)(24,"button",61),C("click",function(){let r=_(t).$implicit,s=c(3);return x(s.openUserPlan(r))}),a(25,"\u0110\u1ED5i g\xF3i"),n()()()}if(i&2){let t=d.$implicit,l=c(3);o(3),E(" ",t.name," "),o(),p(t.isSystemAdmin?4:-1),o(2),u(t.email),o(2),u(t.company),o(3),u(t.role),o(2),k("adm-plan "+l.planClass(t.plan)),o(),u(t.plan),o(2),p(t.planEndDate?16:17),o(3),u(t.revenueText||"0 \u0111"),o(2),u(b(22,12,t.createdAt,"dd/MM/yyyy")),o(3),S("disabled",t.isSystemAdmin)}}function Rt(i,d){if(i&1&&(e(0,"div",35)(1,"table")(2,"thead")(3,"tr")(4,"th"),a(5,"Ng\u01B0\u1EDDi d\xF9ng"),n(),e(6,"th"),a(7,"C\xF4ng ty"),n(),e(8,"th"),a(9,"Vai tr\xF2"),n(),e(10,"th"),a(11,"G\xF3i"),n(),e(12,"th"),a(13,"Hi\u1EC7u l\u1EF1c"),n(),e(14,"th"),a(15,"Doanh thu"),n(),e(16,"th"),a(17,"Ng\xE0y t\u1EA1o"),n(),f(18,"th"),n()(),e(19,"tbody"),M(20,qt,26,15,"tr",null,it),n()()()),i&2){let t=c(2);o(20),D(t.users)}}function Nt(i,d){if(i&1){let t=v();e(0,"div",7)(1,"div",30)(2,"div")(3,"h3"),a(4,"Ng\u01B0\u1EDDi d\xF9ng & G\xF3i"),n(),m(5,Pt,6,12,"p",31),n(),e(6,"input",57),B("ngModelChange",function(r){_(t);let s=c();return P(s.userSearch,r)||(s.userSearch=r),x(r)}),C("input",function(){_(t);let r=c();return x(r.loadUsers())}),n()(),m(7,Bt,5,0,"div",34)(8,Rt,22,0,"div",35),n()}if(i&2){let t,l=c();o(5),p((t=l.stats)?5:-1,t),o(),T("ngModel",l.userSearch),o(),p(l.users.length?8:7)}}function jt(i,d){i&1&&(e(0,"div",62),f(1,"div",63),n())}function $t(i,d){i&1&&(e(0,"div",64)(1,"div",7)(2,"div",30)(3,"div")(4,"h3"),a(5,"Doanh thu theo g\xF3i"),n(),e(6,"p",31),a(7,"Doanh thu c\xE1c g\xF3i \u0111ang k\xEDch ho\u1EA1t"),n()()(),e(8,"div",65)(9,"div",66),f(10,"canvas",null,0),n()()(),e(12,"div",7)(13,"div",30)(14,"div")(15,"h3"),a(16,"Ph\xE2n b\u1ED1 ng\u01B0\u1EDDi d\xF9ng theo g\xF3i"),n(),e(17,"p",31),a(18,"T\xEDnh tr\xEAn g\xF3i \u0111ang c\xF2n hi\u1EC7u l\u1EF1c"),n()()(),e(19,"div",65)(20,"div",66),f(21,"canvas",null,1),n()()()(),e(23,"div",7)(24,"div",30)(25,"div")(26,"h3"),a(27,"M\u1EE9c s\u1EED d\u1EE5ng to\xE0n h\u1EC7 th\u1ED1ng"),n(),e(28,"p",31),a(29,"M\xE3 v\u1EA1ch & M\u1EABu tem t\u1EA1o theo th\xE1ng, t\u1EA5t c\u1EA3 t\u1ED5 ch\u1EE9c"),n()()(),e(30,"div",65)(31,"div",66),f(32,"canvas",null,2),n()()())}function Lt(i,d){if(i&1&&m(0,jt,2,0,"div",62)(1,$t,34,0),i&2){let t=c();p(t.reports?1:0)}}function Gt(i,d){if(i&1&&(a(0),g(1,"date"),g(2,"date")),i&2){let t=c(4);F(" ",b(1,2,t.support.planStartDate,"dd/MM/yyyy")," \u2192 ",b(2,5,t.support.planEndDate,"dd/MM/yyyy")," ")}}function zt(i,d){i&1&&a(0," Kh\xF4ng gi\u1EDBi h\u1EA1n ")}function Wt(i,d){if(i&1&&(e(0,"span",55),a(1),n()),i&2){let t=c(4);k("adm-days "+t.daysClass(t.daysLeft(t.support.planEndDate))),o(),E("c\xF2n ",t.daysLeft(t.support.planEndDate)," ng\xE0y")}}function Kt(i,d){i&1&&a(0," \u2014 ")}function Ht(i,d){if(i&1&&(e(0,"div",70)(1,"div",71),a(2),n(),e(3,"div")(4,"h4"),a(5),n(),e(6,"div",31),a(7),e(8,"span",46),a(9),n(),e(10,"span",49),a(11),n()()()(),e(12,"div",72)(13,"div",73)(14,"span"),a(15,"Vai tr\xF2"),n(),e(16,"b"),a(17),n()(),e(18,"div",73)(19,"span"),a(20,"Hi\u1EC7u l\u1EF1c g\xF3i"),n(),e(21,"b"),m(22,Gt,3,8)(23,zt,1,0),n()(),e(24,"div",73)(25,"span"),a(26,"C\xF2n l\u1EA1i"),n(),e(27,"b"),m(28,Wt,2,3,"span",74)(29,Kt,1,0),n()(),e(30,"div",73)(31,"span"),a(32,"Th\xE0nh vi\xEAn"),n(),e(33,"b"),a(34),n()(),e(35,"div",73)(36,"span"),a(37,"M\xE3 v\u1EA1ch"),n(),e(38,"b"),a(39),g(40,"number"),n()(),e(41,"div",73)(42,"span"),a(43,"Ng\xE0y t\u1EA1o"),n(),e(44,"b"),a(45),g(46,"date"),n()()()),i&2){let t=c(3);o(2),u(t.initial(t.support.name)),o(3),u(t.support.name),o(2),F(" ",t.support.email," \xB7 ",t.support.company," "),o(),k("adm-plan "+t.planClass(t.support.plan||"free")),o(),u(t.support.plan),o(),h("badge-success",t.support.emailVerified)("badge-muted",!t.support.emailVerified),o(),E(" ",t.support.emailVerified?"\u0110\xE3 x\xE1c th\u1EF1c":"Ch\u01B0a x\xE1c th\u1EF1c"," "),o(6),u(t.support.role),o(5),p(t.support.planEndDate?22:23),o(6),p(t.support.planEndDate?28:29),o(6),u(t.support.memberCount),o(5),u(y(40,18,t.support.barcodeCount)),o(6),u(b(46,20,t.support.createdAt,"dd/MM/yyyy"))}}function Ut(i,d){i&1&&(e(0,"div",34)(1,"h4"),a(2,"Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n"),n(),e(3,"p"),a(4,"Kh\xF4ng c\xF3 t\xE0i kho\u1EA3n n\xE0o d\xF9ng email n\xE0y. Ki\u1EC3m tra l\u1EA1i ch\xEDnh t\u1EA3 ho\u1EB7c h\u1ECFi kh\xE1ch email \u0111\xE3 \u0111\u0103ng k\xFD."),n()())}function Qt(i,d){if(i&1&&m(0,Ht,47,23)(1,Ut,5,0,"div",34),i&2){let t=c(2);p(t.support.found?0:1)}}function Yt(i,d){if(i&1){let t=v();e(0,"div",7)(1,"div",30)(2,"div")(3,"h3"),a(4,"Tra c\u1EE9u t\xE0i kho\u1EA3n"),n(),e(5,"p",31),a(6,"T\xECm theo email \u0111\u1EC3 xem t\xECnh tr\u1EA1ng t\xE0i kho\u1EA3n khi h\u1ED7 tr\u1EE3 kh\xE1ch."),n()()(),e(7,"div",65)(8,"div",67)(9,"input",68),B("ngModelChange",function(r){_(t);let s=c();return P(s.supportEmail,r)||(s.supportEmail=r),x(r)}),C("keyup.enter",function(){_(t);let r=c();return x(r.searchSupport())}),n(),e(10,"button",69),C("click",function(){_(t);let r=c();return x(r.searchSupport())}),a(11,"T\xECm ki\u1EBFm"),n()(),m(12,Qt,2,1),n()()}if(i&2){let t=c();o(9),T("ngModel",t.supportEmail),o(3),p(t.support?12:-1)}}function Zt(i,d){if(i&1&&(e(0,"div",44),a(1),n(),e(2,"div",44),a(3,"M\xE3 \u0111\u01A1n "),e(4,"b",42),a(5),n()()),i&2){let t=d;o(),F("",t.contactName," \xB7 ",t.contactPhone),o(4),u(t.orderCode)}}function Xt(i,d){i&1&&(e(0,"div",81),a(1),g(2,"number"),n()),i&2&&(o(),E("",y(2,1,d.amount),"\u20AB"))}function Jt(i,d){if(i&1&&(e(0,"p",82),a(1),n()),i&2){let t=c();o(),E("Ghi ch\xFA c\u1EE7a kh\xE1ch: \u201C",t.request==null?null:t.request.note,"\u201D")}}function te(i,d){if(i&1&&(e(0,"p",83),a(1),g(2,"date"),n()),i&2){let t=c();o(),F("Kh\xE1ch \u0111ang d\xF9ng ",t.request==null?null:t.request.currentPlan," \u0111\u1EBFn ",b(2,2,t.request==null?null:t.request.currentEndDate,"dd/MM/yyyy")," \u2014 g\xF3i m\u1EDBi n\u1ED1i ti\u1EBFp t\u1EEB ng\xE0y \u0111\xF3 \u0111\u1EC3 kh\xF4ng m\u1EA5t s\u1ED1 ng\xE0y \u0111\xE3 tr\u1EA3.")}}function ee(i,d){if(i&1&&(e(0,"option",95),a(1),n()),i&2){let t=d.$implicit;S("value",t),o(),u(t)}}function ne(i,d){if(i&1){let t=v();e(0,"div",84)(1,"label",86),a(2,"G\xF3i"),n(),e(3,"select",94),B("ngModelChange",function(r){_(t);let s=c();return P(s.plan,r)||(s.plan=r),x(r)}),M(4,ee,2,2,"option",95,j),n()()}if(i&2){let t=c(),l=c();o(3),T("ngModel",t.plan),o(),D(l.plans)}}function ie(i,d){if(i&1){let t=v();e(0,"button",96),C("click",function(){let r=_(t).$implicit,s=c();return x(s.cycle=r.key)}),a(1),n()}if(i&2){let t=d.$implicit,l=c();h("active",l.cycle===t.key),S("disabled",l.plan==="Free"),o(),u(t.name)}}function ae(i,d){i&1&&(e(0,"div",83),a(1,"Chuy\u1EC3n v\u1EC1 g\xF3i Free: c\xE1c t\xEDnh n\u0103ng tr\u1EA3 ph\xED b\u1ECB kh\xF3a ngay v\xE0 g\xF3i kh\xF4ng c\xF3 ng\xE0y h\u1EBFt h\u1EA1n."),n())}function oe(i,d){if(i&1&&(e(0,"div",90),a(1," G\xF3i c\xF3 hi\u1EC7u l\u1EF1c \u0111\u1EBFn "),e(2,"b"),a(3),g(4,"date"),n(),a(5," \u2014 qua ng\xE0y n\xE0y t\xE0i kho\u1EA3n t\u1EF1 chuy\u1EC3n v\u1EC1 g\xF3i Free. "),n()),i&2){let t=c(2);o(3),u(b(4,1,t.grantEnd,"dd/MM/yyyy"))}}function re(i,d){if(i&1){let t=v();e(0,"div",84)(1,"label",86),a(2,"Ghi ch\xFA n\u1ED9i b\u1ED9 (kh\xF4ng b\u1EAFt bu\u1ED9c)"),n(),e(3,"input",97),B("ngModelChange",function(r){_(t);let s=c();return P(s.note,r)||(s.note=r),x(r)}),n()()}if(i&2){let t=c();o(3),T("ngModel",t.note)}}function le(i,d){i&1&&a(0," \u0110ang x\u1EED l\xFD... ")}function de(i,d){i&1&&a(0," X\xE1c nh\u1EADn \u0111\xE3 thanh to\xE1n & k\xEDch ho\u1EA1t ")}function ce(i,d){i&1&&a(0," \xC1p d\u1EE5ng ")}function se(i,d){if(i&1){let t=v();e(0,"div",75),C("click",function(){_(t);let r=c();return x(r.closeGrant())}),e(1,"div",76),C("click",function(r){return _(t),x(r.stopPropagation())}),e(2,"div",77)(3,"h3"),a(4),n(),e(5,"button",78),C("click",function(){_(t);let r=c();return x(r.closeGrant())}),a(6,"\xD7"),n()(),e(7,"div",79)(8,"div",80)(9,"div")(10,"b"),a(11),n(),m(12,Zt,6,3),n(),m(13,Xt,3,3,"div",81),n(),m(14,Jt,2,1,"p",82),m(15,te,3,5,"p",83),m(16,ne,6,1,"div",84),e(17,"div",85)(18,"div",84)(19,"label",86),a(20,"Th\u1EDDi h\u1EA1n"),n(),e(21,"div",87),M(22,ie,2,4,"button",88,dt),n()(),e(24,"div",84)(25,"label",86),a(26,"Ng\xE0y b\u1EAFt \u0111\u1EA7u"),n(),e(27,"input",89),B("ngModelChange",function(r){let s=_(t);return P(s.startDate,r)||(s.startDate=r),x(r)}),n()()(),m(28,ae,2,0,"div",83)(29,oe,6,4,"div",90),m(30,re,4,1,"div",84),n(),e(31,"div",91)(32,"button",92),C("click",function(){_(t);let r=c();return x(r.closeGrant())}),a(33,"H\u1EE7y"),n(),e(34,"button",93),C("click",function(){_(t);let r=c();return x(r.confirmGrant())}),m(35,le,1,0)(36,de,1,0)(37,ce,1,0),n()()()()}if(i&2){let t,l,r=d,s=c();o(4),u(r.title),o(7),u(r.who),o(),p((t=r.request)?12:-1,t),o(),p((l=r.request)?13:-1,l),o(),p(r.request!=null&&r.request.note?14:-1),o(),p(r.request!=null&&r.request.isRenewal?15:-1),o(),p(r.kind==="user"?16:-1),o(6),D(s.terms),o(5),T("ngModel",r.startDate),o(),p(r.plan==="Free"?28:s.grantEnd?29:-1),o(2),p(r.kind==="request"?30:-1),o(2),S("disabled",s.working),o(2),S("disabled",s.working||!r.startDate),o(),p(s.working?35:r.kind==="request"?36:37)}}function ue(i,d){i&1&&a(0," \u0110ang x\u1EED l\xFD... ")}function me(i,d){i&1&&a(0," T\u1EEB ch\u1ED1i y\xEAu c\u1EA7u ")}function pe(i,d){if(i&1){let t=v();e(0,"div",75),C("click",function(){_(t);let r=c();return x(r.closeReject())}),e(1,"div",76),C("click",function(r){return _(t),x(r.stopPropagation())}),e(2,"div",77)(3,"h3"),a(4),n(),e(5,"button",78),C("click",function(){_(t);let r=c();return x(r.closeReject())}),a(6,"\xD7"),n()(),e(7,"div",79)(8,"p",98),a(9,"L\xFD do s\u1EBD hi\u1EC3n th\u1ECB cho kh\xE1ch h\xE0ng t\u1EA1i m\xE0n h\xECnh G\xF3i d\u1ECBch v\u1EE5."),n(),e(10,"div",84)(11,"label",86),a(12,"L\xFD do"),n(),e(13,"input",99),B("ngModelChange",function(r){_(t);let s=c();return P(s.rejectNote,r)||(s.rejectNote=r),x(r)}),n()()(),e(14,"div",91)(15,"button",92),C("click",function(){_(t);let r=c();return x(r.closeReject())}),a(16,"\u0110\xF3ng"),n(),e(17,"button",100),C("click",function(){_(t);let r=c();return x(r.confirmReject())}),m(18,ue,1,0)(19,me,1,0),n()()()()}if(i&2){let t=c();o(4),E("T\u1EEB ch\u1ED1i y\xEAu c\u1EA7u ",d.orderCode),o(9),T("ngModel",t.rejectNote),o(2),S("disabled",t.working),o(2),S("disabled",t.working),o(),p(t.working?18:19)}}V.register(...nt);var ke=(()=>{class i{api=N(et);toast=N(H);tab="requests";loading=!0;stats=null;users=[];userSearch="";plans=["Free","Pro","Business"];terms=[{key:"trial",name:"D\xF9ng th\u1EED 30 ng\xE0y (Free / Gia h\u1EA1n th\xEAm 30 ng\xE0y)",months:1},{key:"month",name:"1 th\xE1ng",months:1},{key:"year",name:"1 n\u0103m",months:12},{key:"2year",name:"2 n\u0103m",months:24}];requests=[];requestFilter="pending";expiring=[];expiringDays=14;expiringWindows=[7,14,30];grant=null;rejecting=null;rejectNote="";working=!1;reports=null;supportEmail="";support=null;revenueRef;usersRef;usageRef;charts=[];ngOnInit(){this.loadStats(),this.loadRequests(),this.loadUsers()}loadStats(){this.api.get("/admin/stats").subscribe({next:t=>{this.stats=t,this.loading=!1;try{setTimeout(()=>this.renderRevSub(),60)}catch(e){}},error:()=>{this.loading=!1}})}
renderRevSub(){
  try {
    const revBtns = document.querySelectorAll('button');
    let btn = Array.from(revBtns).find(b => b.innerText && b.innerText.includes('Doanh thu'));
    if(!btn || !this.stats) return;
    let sub = btn.querySelector('.dsgn-rev-detail-box');
    if(!sub) {
      sub = document.createElement('div');
      sub.className = 'dsgn-rev-detail-box';
      sub.style.cssText = 'font-size:11px;font-weight:600;color:#059669;margin-top:3px;display:flex;gap:8px;';
      const lastSpan = btn.querySelector('span:last-child') || btn;
      lastSpan.appendChild(sub);
    }
    let m = (this.stats.mrr || 0);
    let q = (this.stats.quarterlyRevenue ?? (m * 3));
    let y = (this.stats.yearlyRevenue ?? (m * 12));
    sub.innerHTML = `<span>Quý: ${q.toLocaleString('vi-VN')}đ</span><span>·</span><span>Năm: ${y.toLocaleString('vi-VN')}đ</span>`;
    btn.title = `Doanh thu tháng: ${m.toLocaleString('vi-VN')} đ | Quý: ${q.toLocaleString('vi-VN')} đ | Năm: ${y.toLocaleString('vi-VN')} đ`;
  } catch(e){}
}

openUserProfile(u){
  if(!u) return;
  this.api.get("/admin/users/" + u.id + "/details").subscribe({
    next: (det) => this.showProfileModal(det || u),
    error: () => this.showProfileModal(u)
  });
}
attachUserRowActions(){
  try {
    const table = document.querySelector(".table-wrapper table") || document.querySelector("table");
    if (!table) return;
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((tr, idx) => {
      const u = this.users && this.users[idx];
      if (!u) return;

      const firstTd = tr.querySelector("td:first-child");
      if (firstTd && !firstTd.dataset.hasProfileClick) {
        firstTd.dataset.hasProfileClick = "1";
        firstTd.style.cursor = "pointer";
        firstTd.title = "B\u1EA5m \u0111\u1EC3 xem h\u1ED3 s\u01A1 & reset m\u1EADt kh\u1EA9u cho kh\xE1ch";
        firstTd.addEventListener("click", () => this.openUserProfile(u));

        const mainDiv = firstTd.querySelector(".adm-cell-main") || firstTd.children[0];
        if (mainDiv && !mainDiv.querySelector(".adm-profile-tag")) {
          const tag = document.createElement("span");
          tag.className = "adm-profile-tag";
          tag.innerText = "H\u1ED3 s\u01A1";
          tag.style.cssText = "font-size:10.5px;font-weight:600;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;padding:1px 6px;border-radius:4px;margin-left:6px;cursor:pointer;";
          mainDiv.appendChild(tag);
        }
      }

      const lastTd = tr.querySelector("td:last-child");
      if (lastTd && !lastTd.dataset.hasProfileBtn) {
        lastTd.dataset.hasProfileBtn = "1";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-outline btn-sm";
        btn.innerHTML = "&#128100; H\u1ED3 s\u01A1";
        btn.title = "Xem h\u1ED3 s\u01A1 \u0111\u0103ng k\xFD v\xE0 \u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u";
        btn.style.cssText = "margin-right:6px;color:#1d4ed8;border-color:#93c5fd;background:#f0f7ff;font-weight:600;";
        btn.onclick = (e) => {
          e.stopPropagation();
          this.openUserProfile(u);
        };
        lastTd.insertBefore(btn, lastTd.firstChild);
      }
    });
  } catch(e) {}
}
attachSupportResetPassword(){
  try {
    if (!this.support || !this.support.found || !this.support.id) return;
    const profile = document.querySelector(".adm-profile");
    if (!profile || profile.querySelector("#adm-btn-support-reset")) return;
    const box = document.createElement("div");
    box.id = "adm-btn-support-reset";
    box.style.cssText = "margin-top:14px;display:flex;gap:10px;";
    box.innerHTML = '<button type="button" class="btn btn-primary btn-sm" style="background:#d97706;border:none;font-weight:600;padding:8px 14px;cursor:pointer;border-radius:8px;">&#128273; \u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u & Xem \u0111\u1EA7y \u0111\u1EE7 h\u1ED3 s\u01A1</button>';
    box.querySelector("button").onclick = () => this.openUserProfile(this.support);
    profile.appendChild(box);
  } catch(e) {}
}
showProfileModal(d){
  let old = document.getElementById("adm-user-modal-box");
  if (old) old.remove();

  const backdrop = document.createElement("div");
  backdrop.id = "adm-user-modal-box";
  backdrop.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";

  const modal = document.createElement("div");
  modal.style.cssText = "background:#ffffff;border-radius:18px;max-width:620px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);border:1px solid #e2e8f0;overflow:hidden;font-family:inherit;";

  const initial = (d.name || d.email || "U").trim().charAt(0).toUpperCase();
  const createdDate = d.createdAt ? new Date(d.createdAt).toLocaleDateString("vi-VN") : "---";
  const endDate = d.planEndDate ? new Date(d.planEndDate).toLocaleDateString("vi-VN") : (d.isSystemAdmin ? "V\xF4 th\u1EDDi h\u1EA1n (Admin)" : "Kh\xF4ng gi\u1EDBi h\u1EA1n");
  const phone = d.phone || "Ch\u01B0a c\u1EADp nh\u1EADt";
  const company = d.company || d.orgName || "C\xE1 nh\xE2n / Ch\u01B0a c\u1EADp nh\u1EADt";
  const roleText = d.isSystemAdmin ? "Qu\u1EA3n tr\u1ECB vi\xEAn h\u1EC7 th\u1ED1ng (Admin)" : (d.role === "Owner" ? "Ch\u1EE7 t\xE0i kho\u1EA3n (Owner)" : (d.role || "Th\xE0nh vi\xEAn"));
  const planColor = (d.plan || "").toLowerCase() === "business" ? "#7c3aed" : ((d.plan || "").toLowerCase() === "pro" ? "#2563eb" : "#64748b");

  modal.innerHTML = `
    <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:46px;height:46px;border-radius:12px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">${initial}</div>
        <div>
          <div style="font-size:17px;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:8px;">
            ${d.name || d.email}
            ${d.isSystemAdmin ? '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#fef3c7;color:#b45309;">ADMIN</span>' : ''}
          </div>
          <div style="font-size:13px;color:#64748b;margin-top:2px;">${d.email} · <b style="color:#334155;">${company}</b></div>
        </div>
      </div>
      <button id="adm-close-modal" type="button" style="border:none;background:transparent;font-size:22px;color:#94a3b8;cursor:pointer;padding:4px 8px;border-radius:8px;line-height:1;">✕</button>
    </div>

    <div style="padding:22px 24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:18px;">
      
      <!-- Thong tin ho so dang ky -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
        <div style="font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
          &#128203; Th\xF4ng tin h\u1ED3 s\u01A1 \u0111\u0103ng k\xFD
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px 16px;font-size:13px;">
          <div><span style="color:#64748b;">H\u1ECD v\xE0 t\xEAn:</span> <b style="color:#1e293b;">${d.name || '---'}</b></div>
          <div><span style="color:#64748b;">S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:</span> <b style="color:#1e293b;">${phone}</b></div>
          <div><span style="color:#64748b;">Email:</span> <b style="color:#1e293b;">${d.email}</b></div>
          <div><span style="color:#64748b;">C\xF4ng ty / T\u1ED5 ch\u1EE9c:</span> <b style="color:#1e293b;">${company}</b></div>
          <div><span style="color:#64748b;">Vai tr\xF2:</span> <b style="color:#1e293b;">${roleText}</b></div>
          <div><span style="color:#64748b;">Ng\xE0y \u0111\u0103ng k\xFD:</span> <b style="color:#1e293b;">${createdDate}</b></div>
        </div>
      </div>

      <!-- Thong tin goi cuoc & su dung -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:13.5px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:6px;">
            &#128142; G\xF3i c\u01B0\u1EDBc & S\u1EED d\u1EE5ng
          </div>
          <button id="adm-btn-change-plan" type="button" style="font-size:12px;font-weight:600;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:4px 10px;cursor:pointer;">&#128179; \u0110\u1ED5i g\xF3i c\u01B0\u1EDBc</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px 16px;font-size:13px;">
          <div><span style="color:#64748b;">G\xF3i hi\u1EC7n t\u1EA1i:</span> <span style="font-weight:700;color:${planColor};background:#f1f5f9;padding:2px 8px;border-radius:6px;">${d.planName || d.plan || 'Free'}</span></div>
          <div><span style="color:#64748b;">Th\u1EDDi h\u1EA1n hi\u1EC7u l\u1EF1c:</span> <b style="color:#1e293b;">${endDate}</b></div>
          <div><span style="color:#64748b;">Doanh thu t\u1EEB kh\xE1ch:</span> <b style="color:#059669;">${d.revenueText || '0 \u0111'}</b></div>
          <div><span style="color:#64748b;">M\xE3 v\u1EA1ch \u0111\xE3 t\u1EA1o:</span> <b style="color:#1e293b;">${d.barcodeCount ?? 0} m\xE3</b></div>
          <div><span style="color:#64748b;">M\u1EABu tem \u0111\xE3 l\u01B0u:</span> <b style="color:#1e293b;">${d.templateCount ?? 0} m\u1EABu</b></div>
          <div><span style="color:#64748b;">Th\xE0nh vi\xEAn t\u1ED5 ch\u1EE9c:</span> <b style="color:#1e293b;">${d.memberCount ?? 1} ng\u01B0\u1EDDi</b></div>
        </div>
      </div>

      <!-- Quan tri mat khau / Reset Password -->
      <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:16px;">
        <div style="font-size:14px;font-weight:750;color:#92400e;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          &#128273; \u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u (Reset M\u1EADt kh\u1EA9u cho kh\xE1ch)
        </div>
        <div style="font-size:12.5px;color:#78350f;margin-bottom:12px;line-height:1.4;">
          N\u1EBFu kh\xE1ch h\xE0ng qu\xEAn m\u1EADt kh\u1EA9u ho\u1EB7c c\u1EA7n c\u1EA5p l\u1EA1i, Admin c\xF3 th\u1EC3 \u0111\u1EB7t m\u1EADt kh\u1EA9u m\u1EDBi tr\u1EF1c ti\u1EBFp t\u1EA1i \u0111\xE2y v\xE0 g\u1EEDi l\u1EA1i cho kh\xE1ch:
        </div>
        
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="adm-new-pass-input" type="text" value="12345678" style="flex:1;padding:9px 12px;border:1.5px solid #d97706;border-radius:8px;font-size:14px;font-weight:700;color:#0f172a;background:#ffffff;outline:none;" placeholder="Nh\u1EADp m\u1EADt kh\u1EA9u m\u1EDBi..." />
          <button id="adm-btn-submit-pass" type="button" style="background:#d97706;color:#ffffff;border:none;border-radius:8px;font-weight:700;font-size:13px;padding:10px 16px;cursor:pointer;white-space:nowrap;transition:background .15s;">X\xE1c nh\u1EADn \u0111\u1ED5i</button>
        </div>

        <div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:11.5px;color:#92400e;">G\u1EE3i \xFD nhanh:</span>
          <button type="button" class="adm-quick-pass" data-val="12345678" style="font-size:11px;padding:2px 8px;border-radius:6px;background:#ffffff;border:1px solid #fcd34d;color:#92400e;cursor:pointer;font-weight:600;">12345678</button>
          <button type="button" class="adm-quick-pass" data-val="Hacode@123" style="font-size:11px;padding:2px 8px;border-radius:6px;background:#ffffff;border:1px solid #fcd34d;color:#92400e;cursor:pointer;font-weight:600;">Hacode@123</button>
          <button type="button" class="adm-quick-pass" data-val="random" style="font-size:11px;padding:2px 8px;border-radius:6px;background:#ffffff;border:1px solid #fcd34d;color:#92400e;cursor:pointer;font-weight:600;">&#127922; Ng\u1EABu nhi\xEAn (8 s\u1ED1)</button>
        </div>

        <!-- Hop ket qua sau khi doi thanh cong -->
        <div id="adm-pass-success-box" style="display:none;margin-top:14px;padding:12px 14px;background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:10px;">
          <div style="font-size:13px;font-weight:700;color:#065f46;display:flex;align-items:center;gap:6px;">
            &#9989; \u0110\xE3 \u0111\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng cho ${d.name || d.email}!
          </div>
          <div style="margin-top:6px;font-size:13px;color:#047857;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span>M\u1EADt kh\u1EA9u m\u1EDBi:</span>
            <b id="adm-pass-success-val" style="font-size:15px;background:#ffffff;padding:2px 8px;border-radius:6px;border:1px solid #a7f3d0;color:#065f46;font-family:monospace;letter-spacing:0.5px;">12345678</b>
            <button id="adm-btn-copy-pass" type="button" style="background:#059669;color:#fff;border:none;border-radius:6px;font-size:11.5px;font-weight:600;padding:4px 10px;cursor:pointer;">&#128203; Sao ch\xE9p m\u1EADt kh\u1EA9u</button>
          </div>
        </div>

      </div>

    </div>

    <div style="padding:14px 24px;border-top:1px solid #f1f5f9;background:#f8fafc;display:flex;justify-content:flex-end;">
      <button id="adm-close-modal-btn" type="button" style="padding:8px 18px;border-radius:8px;background:#e2e8f0;color:#334155;border:none;font-weight:600;font-size:13px;cursor:pointer;">\u0110\xF3ng</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const closeModal = () => backdrop.remove();
  modal.querySelector("#adm-close-modal").onclick = closeModal;
  modal.querySelector("#adm-close-modal-btn").onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

  const changePlanBtn = modal.querySelector("#adm-btn-change-plan");
  if (changePlanBtn) {
    changePlanBtn.onclick = () => {
      closeModal();
      this.openUserPlan(d);
    };
  }

  const passInput = modal.querySelector("#adm-new-pass-input");
  modal.querySelectorAll(".adm-quick-pass").forEach(btn => {
    btn.onclick = () => {
      const val = btn.getAttribute("data-val");
      if (val === "random") {
        passInput.value = String(Math.floor(10000000 + Math.random() * 90000000));
      } else {
        passInput.value = val;
      }
    };
  });

  const submitBtn = modal.querySelector("#adm-btn-submit-pass");
  const successBox = modal.querySelector("#adm-pass-success-box");
  const successVal = modal.querySelector("#adm-pass-success-val");
  const copyBtn = modal.querySelector("#adm-btn-copy-pass");

  submitBtn.onclick = () => {
    const newPass = passInput.value.trim();
    if (!newPass || newPass.length < 6) {
      this.toast.error("M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1");
      return;
    }
    submitBtn.disabled = true;
    submitBtn.innerText = "\u0110ang l\u01B0u...";
    submitBtn.style.background = "#9ca3af";

    this.api.post("/admin/users/" + d.id + "/reset-password", { newPassword: newPass }).subscribe({
      next: (res) => {
        submitBtn.disabled = false;
        submitBtn.innerText = "X\xE1c nh\u1EADn \u0111\u1ED5i";
        submitBtn.style.background = "#d97706";
        successVal.innerText = newPass;
        successBox.style.display = "block";
        this.toast.success(`\u0110\xE3 reset m\u1EADt kh\u1EA9u cho ${d.name || d.email} th\xE0nh c\xF4ng!`);
      },
      error: (err) => {
        submitBtn.disabled = false;
        submitBtn.innerText = "X\xE1c nh\u1EADn \u0111\u1ED5i";
        submitBtn.style.background = "#d97706";
        this.toast.error(err.error?.message || "Kh\xF4ng th\u1EC3 \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u");
      }
    });
  };

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(successVal.innerText).then(() => {
      copyBtn.innerText = "\u0110\xE3 sao ch\xE9p! \u2713";
      setTimeout(() => { copyBtn.innerText = "&#128203; Sao ch\xE9p m\u1EADt kh\u1EA9u"; }, 2000);
    });
  };
}

setTab(t){this.tab=t;try{setTimeout(()=>this.renderRevSub(),50);t==="users"&&setTimeout(()=>this.attachUserRowActions(),150)}catch(e){};t==="reports"&&!this.reports&&this.loadReports(),t==="reports"&&this.reports&&setTimeout(()=>this.renderCharts(),120),t==="requests"&&this.loadRequests(),t==="expiring"&&this.loadExpiring()}loadUsers(){this.api.get("/admin/users",{search:this.userSearch||void 0}).subscribe({next:t=>{this.users=t;try{setTimeout(()=>this.attachUserRowActions(),120)}catch(e){}}})}loadRequests(){this.api.get("/admin/subscription-requests",{status:this.requestFilter}).subscribe({next:t=>this.requests=t})}setRequestFilter(t){this.requestFilter=t,this.loadRequests()}loadExpiring(){this.api.get("/admin/expiring",{days:this.expiringDays}).subscribe({next:t=>this.expiring=t})}setExpiringDays(t){this.expiringDays=t,this.loadExpiring()}loadReports(){this.api.get("/admin/reports").subscribe({next:t=>{this.reports=t,setTimeout(()=>this.renderCharts(),120)}})}get pendingCount(){return this.stats?.pendingRequests??0}get expiringCount(){return this.stats?.expiringSoon??0}openApprove(t){this.grant={kind:"request",request:t,title:`K\xEDch ho\u1EA1t g\xF3i ${t.planName}`,who:t.company,plan:t.plan,cycle:t.cycle,startDate:this.toDateInput(t.suggestedStart),note:""}}openUserPlan(t){t.isSystemAdmin||(this.grant={kind:"user",user:t,title:`\u0110\u1ED5i g\xF3i \u2014 ${t.company}`,who:`${t.name} \xB7 ${t.email}`,plan:t.plan==="Free"?"Pro":t.plan,cycle:"year",startDate:this.toDateInput(t.planEndDate&&new Date(t.planEndDate)>new Date?t.planEndDate:new Date().toISOString()),note:""})}openRenew(t){this.grant={kind:"user",user:{id:t.ownerUserId??"",name:t.ownerName??"",email:t.ownerEmail??"",company:t.company,plan:t.plan,planStartDate:t.startDate,planEndDate:t.endDate,role:"Owner",isSystemAdmin:!1,emailVerified:!0,createdAt:t.startDate},title:`Gia h\u1EA1n \u2014 ${t.company}`,who:`${t.ownerName??""} \xB7 ${t.ownerEmail??""}`,plan:t.plan,cycle:t.cycle||"year",startDate:this.toDateInput(t.endDate),note:""}}closeGrant(){this.working||(this.grant=null)}confirmGrant(){let t=this.grant;if(!t)return;this.working=!0;let l=t.startDate?new Date(t.startDate).toISOString():null,r=O=>{this.toast.success(O),this.working=!1,this.grant=null,this.loadStats(),this.loadUsers(),this.loadRequests(),this.tab==="expiring"&&this.loadExpiring()},s=O=>{this.toast.error(O.error?.detail||"Thao t\xE1c th\u1EA5t b\u1EA1i"),this.working=!1};if(t.kind==="request"&&t.request){this.api.post(`/admin/subscription-requests/${t.request.id}/approve`,{cycle:t.cycle,startDate:l,note:t.note.trim()||null}).subscribe({next:()=>r(`\u0110\xE3 k\xEDch ho\u1EA1t g\xF3i cho ${t.who}`),error:s});return}if(t.user?.id){this.api.put(`/admin/users/${t.user.id}/plan`,{plan:t.plan,cycle:t.cycle,startDate:l}).subscribe({next:()=>r(t.plan==="Free"?`\u0110\xE3 chuy\u1EC3n ${t.who} v\u1EC1 g\xF3i Free`:`\u0110\xE3 c\u1EA5p g\xF3i ${t.plan} cho ${t.who}`),error:s});return}this.toast.error("Kh\xF4ng x\xE1c \u0111\u1ECBnh \u0111\u01B0\u1EE3c t\xE0i kho\u1EA3n \u0111\u1EC3 \u0111\u1ED5i g\xF3i"),this.working=!1}get grantEnd(){if(!this.grant?.startDate||this.grant.plan==="Free")return null;let t=this.terms.find(r=>r.key===this.grant.cycle)?.months??1,l=new Date(this.grant.startDate);return isNaN(l.getTime())?null:(l.setMonth(l.getMonth()+t),l)}openReject(t){this.rejecting=t,this.rejectNote=""}closeReject(){this.working||(this.rejecting=null)}confirmReject(){let t=this.rejecting;t&&(this.working=!0,this.api.post(`/admin/subscription-requests/${t.id}/reject`,{note:this.rejectNote.trim()||null}).subscribe({next:()=>{this.toast.success("\u0110\xE3 t\u1EEB ch\u1ED1i y\xEAu c\u1EA7u"),this.working=!1,this.rejecting=null,this.loadRequests(),this.loadStats()},error:l=>{this.toast.error(l.error?.detail||"Thao t\xE1c th\u1EA5t b\u1EA1i"),this.working=!1}}))}statusLabel(t){return t==="Pending"?"Ch\u1EDD x\xE1c nh\u1EADn":t==="Approved"?"\u0110\xE3 k\xEDch ho\u1EA1t":t==="Rejected"?"\u0110\xE3 t\u1EEB ch\u1ED1i":"Kh\xE1ch \u0111\xE3 h\u1EE7y"}ageText(t){let l=this.daysSince(t);return l<=0?"g\u1EEDi h\xF4m nay":`ch\u1EDD ${l} ng\xE0y`}ageClass(t){let l=this.daysSince(t);return l>=3?"late":l>=1?"warn":"fresh"}daysLeft(t){if(!t)return null;let l=new Date(t).getTime();return isNaN(l)?null:Math.max(0,Math.floor((l-Date.now())/864e5))}daysClass(t){return t===null?"":t<=3?"urgent":t<=7?"soon":""}planClass(t){return"plan-"+(t||"free").toLowerCase()}initial(t){return(t||"?").trim().charAt(0).toUpperCase()}daysSince(t){let l=new Date(t).getTime();return isNaN(l)?0:Math.max(0,Math.floor((Date.now()-l)/864e5))}toDateInput(t){if(!t)return"";let l=new Date(t);if(isNaN(l.getTime()))return"";let r=s=>String(s).padStart(2,"0");return`${l.getFullYear()}-${r(l.getMonth()+1)}-${r(l.getDate())}`}searchSupport(){this.supportEmail.trim()&&this.api.get("/admin/support",{email:this.supportEmail.trim()}).subscribe({next:t=>{this.support=t;try{setTimeout(()=>this.attachSupportResetPassword(),120)}catch(e){}}})}renderCharts(){
  if(!this.reports)return;
  this.charts.forEach(r=>r.destroy()),this.charts=[];
  let t="#116cbf",l=["#94a3b8","#3b82f6","#116cbf","#22c55e"];

  this.revenueRef&&this.charts.push(new V(this.revenueRef.nativeElement,{
    type:"bar",
    data:{
      labels:Object.keys(this.reports.revenueByPlan),
      datasets:[{
        label:"Doanh thu (\u0111)",
        data:Object.values(this.reports.revenueByPlan),
        backgroundColor:t,
        borderRadius:6
      }]
    },
    options:{
      responsive:!0,
      maintainAspectRatio:!1,
      plugins:{
        legend:{display:!1},
        tooltip:{
          callbacks:{
            label:(c)=>` Doanh thu: ${(c.raw||0).toLocaleString('vi-VN')} \u0111`
          }
        }
      },
      scales:{
        y:{
          beginAtZero:!0,
          ticks:{
            callback:(v)=>v.toLocaleString('vi-VN')+" \u0111"
          }
        }
      }
    }
  }));

  try {
    let revCard = this.revenueRef.nativeElement.closest(".card") || this.revenueRef.nativeElement.parentElement;
    if (revCard) {
      let oldRevStats = revCard.querySelector(".adm-rev-plan-stats");
      if (oldRevStats) oldRevStats.remove();
      let revStatsDiv = document.createElement("div");
      revStatsDiv.className = "adm-rev-plan-stats";
      revStatsDiv.style.cssText = "display:flex;justify-content:center;gap:16px;margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;font-size:12.5px;font-weight:600;flex-wrap:wrap;border:1px solid #e2e8f0;";
      let totalRev = Object.values(this.reports.revenueByPlan).reduce((a,b)=>a+b,0);
      revStatsDiv.innerHTML = Object.entries(this.reports.revenueByPlan).map(([k,v]) => {
        return `<div style="display:flex;align-items:center;gap:6px;"><span style="color:#475569;">${k}:</span><b style="color:#059669;">${(v||0).toLocaleString('vi-VN')} \u0111</b></div>`;
      }).join("") + `<div style="margin-left:8px;padding-left:12px;border-left:1px solid #cbd5e1;color:#1e40af;">T\u1ED5ng: <b>${totalRev.toLocaleString('vi-VN')} \u0111</b></div>`;
      revCard.appendChild(revStatsDiv);
    }
  } catch(e){}

  let uTotal = Object.values(this.reports.usersByPlan).reduce((a,b)=>a+b,0);
  let uLabels = Object.entries(this.reports.usersByPlan).map(([k,v]) => {
    let pct = uTotal > 0 ? Math.round(v * 100 / uTotal) : 0;
    return `${k}: ${v} ng\u01B0\u1EDDi (${pct}%)`;
  });

  this.usersRef&&this.charts.push(new V(this.usersRef.nativeElement,{
    type:"doughnut",
    data:{
      labels:uLabels,
      datasets:[{
        data:Object.values(this.reports.usersByPlan),
        backgroundColor:l
      }]
    },
    options:{
      responsive:!0,
      maintainAspectRatio:!1,
      plugins:{
        legend:{
          position:"bottom",
          labels:{
            boxWidth:14,
            padding:12,
            font:{size:12,weight:"bold"}
          }
        },
        tooltip:{
          callbacks:{
            label:(c)=>` ${c.label}`
          }
        }
      }
    }
  }));

  try {
    let userCard = this.usersRef.nativeElement.closest(".card") || this.usersRef.nativeElement.parentElement;
    if (userCard) {
      let oldUStats = userCard.querySelector(".adm-users-plan-stats");
      if (oldUStats) oldUStats.remove();
      let uStatsDiv = document.createElement("div");
      uStatsDiv.className = "adm-users-plan-stats";
      uStatsDiv.style.cssText = "display:flex;justify-content:center;gap:16px;margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;font-size:12.5px;font-weight:600;flex-wrap:wrap;border:1px solid #e2e8f0;";
      uStatsDiv.innerHTML = Object.entries(this.reports.usersByPlan).map(([k,v],idx) => {
        let color = l[idx] || "#2563eb";
        let pct = uTotal > 0 ? Math.round(v * 100 / uTotal) : 0;
        return `<div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span><span style="color:#475569;">${k}:</span><b style="color:#0f172a;">${v} ng\u01B0\u1EDDi</b><span style="color:#64748b;font-size:11.5px;">(${pct}%)</span></div>`;
      }).join("") + `<div style="margin-left:8px;padding-left:12px;border-left:1px solid #cbd5e1;color:#1e40af;">T\u1ED5ng: <b>${uTotal} ng\u01B0\u1EDDi</b></div>`;
      userCard.appendChild(uStatsDiv);
    }
  } catch(e){}

  this.usageRef&&this.charts.push(new V(this.usageRef.nativeElement,{
    type:"bar",
    data:{
      labels:this.reports.systemUsage.map(r=>r.month),
      datasets:[{
        label:"L\u01B0\u1EE3t t\u1EA1o",
        data:this.reports.systemUsage.map(r=>r.count),
        backgroundColor:t,
        borderRadius:6
      }]
    },
    options:{
      responsive:!0,
      maintainAspectRatio:!1,
      plugins:{
        legend:{display:!1},
        tooltip:{
          callbacks:{
            label:(c)=>` L\u01B0\u1EE3t t\u1EA1o (M\xE3 v\u1EA1ch & M\u1EABu tem): ${c.raw} l\u01B0\u1EE3t`
          }
        }
      },
      scales:{
        y:{
          beginAtZero:!0,
          ticks:{precision:0}
        }
      }
    }
  }))
}ngOnDestroy(){this.charts.forEach(t=>t.destroy())}static \u0275fac=function(l){return new(l||i)};static \u0275cmp=L({type:i,selectors:[["app-admin"]],viewQuery:function(l,r){if(l&1&&(I(at,5),I(ot,5),I(rt,5)),l&2){let s;q(s=R())&&(r.revenueRef=s.first),q(s=R())&&(r.usersRef=s.first),q(s=R())&&(r.usageRef=s.first)}},decls:21,vars:20,consts:[["revenueChart",""],["usersChart",""],["usageChart",""],[1,"adm-kpis"],[1,"tabs","adm-tabs"],[1,"tab",3,"click"],[1,"adm-tab-count"],[1,"card"],[1,"modal-backdrop"],["type","button",1,"adm-kpi",3,"click"],[1,"adm-kpi-ico"],["viewBox","0 0 24 24","width","20","height","20","fill","none","stroke","currentColor","stroke-width","2","stroke-linecap","round","stroke-linejoin","round"],["d","M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"],["points","14 2 14 8 20 8"],["x1","12","y1","18","x2","12","y2","12"],["x1","9","y1","15","x2","15","y2","15"],[1,"adm-kpi-body"],[1,"adm-kpi-label"],[1,"adm-kpi-value"],["cx","12","cy","12","r","9"],["points","12 7 12 12 15.5 14"],["type","button",1,"adm-kpi","tone-info",3,"click"],["d","M3 21h18"],["d","M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"],["d","M15 21v-8h3a1 1 0 0 1 1 1v7"],["x1","8","y1","8","x2","8.01","y2","8"],["x1","11","y1","8","x2","11.01","y2","8"],["type","button",1,"adm-kpi","tone-money",3,"click"],["x1","12","y1","1","x2","12","y2","23"],["d","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],[1,"card-header"],[1,"adm-sub"],[1,"bill-cycle"],["type","button",3,"click"],[1,"adm-empty"],[1,"table-wrapper"],[1,"adm-empty-ico"],["viewBox","0 0 24 24","width","26","height","26","fill","none","stroke","currentColor","stroke-width","2.2","stroke-linecap","round","stroke-linejoin","round"],["points","20 6 9 17 4 12"],["type","button",1,"btn","btn-outline"],["type","button",1,"btn","btn-outline",3,"click"],[2,"text-align","right"],[1,"adm-code"],[1,"adm-age",3,"class"],[1,"adm-cell-sub"],[1,"adm-cell-main"],[1,"adm-plan"],[1,"adm-cell-sub","adm-note",3,"title"],[1,"adm-amount"],[1,"badge"],[1,"adm-actions"],[1,"adm-age"],["type","button",1,"btn","btn-primary","btn-sm",3,"click"],["type","button",1,"btn","btn-outline","btn-sm",3,"click"],["type","button",3,"active"],[1,"adm-days"],["type","button",1,"btn","btn-outline","btn-sm"],["placeholder","T\xECm t\xEAn, email, c\xF4ng ty...",1,"form-control",2,"width","260px",3,"ngModelChange","input","ngModel"],[1,"badge","badge-primary"],[1,"badge","badge-muted"],[1,"text-muted"],["type","button",1,"btn","btn-outline","btn-sm",3,"click","disabled"],[1,"loading-overlay"],[1,"spinner"],[1,"grid","grid-2","gap-4","mb-6"],[1,"card-body"],[1,"chart-box"],[1,"flex","gap-3"],["placeholder","Nh\u1EADp email ng\u01B0\u1EDDi d\xF9ng...",1,"form-control",2,"flex","1",3,"ngModelChange","keyup.enter","ngModel"],["type","button",1,"btn","btn-primary",3,"click"],[1,"adm-profile",2,"margin-top","22px"],[1,"adm-avatar"],[1,"adm-facts"],[1,"adm-fact"],[1,"adm-days",3,"class"],[1,"modal-backdrop",3,"click"],[1,"modal","adm-modal",3,"click"],[1,"modal-header"],["type","button","aria-label","\u0110\xF3ng",1,"modal-close",3,"click"],[1,"modal-body"],[1,"adm-sum"],[1,"adm-sum-amount"],[1,"adm-cell-sub",2,"margin-bottom","14px"],[1,"adm-hint"],[1,"form-group"],[1,"adm-field-row"],[1,"form-label"],[1,"bill-cycle",2,"width","100%"],["type","button",2,"flex","1",3,"active","disabled"],["type","date",1,"form-control",3,"ngModelChange","ngModel"],[1,"adm-dates"],[1,"modal-footer"],["type","button",1,"btn","btn-outline",3,"click","disabled"],["type","button",1,"btn","btn-primary",3,"click","disabled"],[1,"form-control",3,"ngModelChange","ngModel"],[3,"value"],["type","button",2,"flex","1",3,"click","disabled"],["placeholder","\u0110\xE3 nh\u1EADn chuy\u1EC3n kho\u1EA3n 12/03, NV Lan x\xE1c nh\u1EADn...",1,"form-control",3,"ngModelChange","ngModel"],[1,"adm-sub",2,"margin-bottom","14px"],["placeholder","Ch\u01B0a nh\u1EADn \u0111\u01B0\u1EE3c thanh to\xE1n",1,"form-control",3,"ngModelChange","ngModel"],["type","button",1,"btn","btn-danger",3,"click","disabled"]],template:function(l,r){if(l&1&&(m(0,ct,59,31,"div",3),e(1,"div",4)(2,"div",5),C("click",function(){return r.setTab("requests")}),a(3," Y\xEAu c\u1EA7u \u0111\u0103ng k\xFD "),m(4,st,2,1,"span",6),n(),e(5,"div",5),C("click",function(){return r.setTab("expiring")}),a(6," S\u1EAFp h\u1EBFt h\u1EA1n "),m(7,ut,2,1,"span",6),n(),e(8,"div",5),C("click",function(){return r.setTab("users")}),a(9,"Ng\u01B0\u1EDDi d\xF9ng & G\xF3i"),n(),e(10,"div",5),C("click",function(){return r.setTab("reports")}),a(11,"B\xE1o c\xE1o"),n(),e(12,"div",5),C("click",function(){return r.setTab("support")}),a(13,"H\u1ED7 tr\u1EE3"),n()(),m(14,kt,14,5,"div",7),m(15,Tt,12,1,"div",7),m(16,Nt,9,3,"div",7),m(17,Lt,2,1),m(18,Yt,13,2,"div",7),m(19,se,38,13,"div",8),m(20,pe,20,5,"div",8)),l&2){let s,O,$;p((s=r.stats)?0:-1,s),o(2),h("active",r.tab==="requests"),o(2),p(r.pendingCount?4:-1),o(),h("active",r.tab==="expiring"),o(2),p(r.expiringCount?7:-1),o(),h("active",r.tab==="users"),o(2),h("active",r.tab==="reports"),o(2),h("active",r.tab==="support"),o(2),p(r.tab==="requests"?14:-1),o(),p(r.tab==="expiring"?15:-1),o(),p(r.tab==="users"?16:-1),o(),p(r.tab==="reports"?17:-1),o(),p(r.tab==="support"?18:-1),o(),p((O=r.grant)?19:-1,O),o(),p(($=r.rejecting)?20:-1,$)}},dependencies:[K,tt,X,J,U,Z,Q,Y,W,z],styles:[".adm-kpis[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.adm-kpi[_ngcontent-%COMP%]{display:flex;align-items:center;gap:13px;padding:14px 16px;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;font:inherit;color:inherit;width:100%}.adm-kpi[_ngcontent-%COMP%]:hover{border-color:var(--primary);box-shadow:var(--shadow-md);transform:translateY(-1px)}.adm-kpi.is-active[_ngcontent-%COMP%]{border-color:var(--primary);box-shadow:0 0 0 3px #116cbf21}.adm-kpi-ico[_ngcontent-%COMP%]{flex:none;width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text-muted)}.adm-kpi-body[_ngcontent-%COMP%]{min-width:0}.adm-kpi-label[_ngcontent-%COMP%]{display:block;font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--text-light);white-space:nowrap}.adm-kpi-value[_ngcontent-%COMP%]{display:block;font-size:25px;font-weight:800;line-height:1.15;letter-spacing:-.02em}.adm-kpi-value[_ngcontent-%COMP%]   small[_ngcontent-%COMP%]{font-size:12.5px;font-weight:600;color:var(--text-light);margin-left:4px}.adm-kpi.tone-work[_ngcontent-%COMP%]   .adm-kpi-ico[_ngcontent-%COMP%]{background:#e0f2fe;color:var(--primary)}.adm-kpi.tone-work[_ngcontent-%COMP%]   .adm-kpi-value[_ngcontent-%COMP%]{color:var(--primary)}.adm-kpi.tone-warn[_ngcontent-%COMP%]   .adm-kpi-ico[_ngcontent-%COMP%]{background:#f59e0b24;color:#b45309}.adm-kpi.tone-warn[_ngcontent-%COMP%]   .adm-kpi-value[_ngcontent-%COMP%]{color:#b45309}.adm-kpi.tone-info[_ngcontent-%COMP%]   .adm-kpi-ico[_ngcontent-%COMP%]{background:#3b82f621;color:var(--info)}.adm-kpi.tone-money[_ngcontent-%COMP%]   .adm-kpi-ico[_ngcontent-%COMP%]{background:#22c55e24;color:#15803d}.adm-kpi.is-idle[_ngcontent-%COMP%]   .adm-kpi-ico[_ngcontent-%COMP%]{background:var(--bg);color:var(--text-light)}.adm-kpi.is-idle[_ngcontent-%COMP%]   .adm-kpi-value[_ngcontent-%COMP%]{color:var(--text-light)}.adm-tabs[_ngcontent-%COMP%]{margin-bottom:18px}.adm-tab-count[_ngcontent-%COMP%]{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;padding:0 6px;margin-left:7px;border-radius:20px;background:var(--danger);color:#fff;font-size:11px;font-weight:800}.tabs[_ngcontent-%COMP%]   .tab.active[_ngcontent-%COMP%]   .adm-tab-count[_ngcontent-%COMP%]{background:var(--primary)}.adm-sub[_ngcontent-%COMP%]{margin-top:2px;font-size:12.5px;color:var(--text-muted)}.adm-cell-main[_ngcontent-%COMP%]{font-weight:600}.adm-cell-sub[_ngcontent-%COMP%]{font-size:12px;color:var(--text-muted);margin-top:2px}.adm-code[_ngcontent-%COMP%]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;font-weight:700}.adm-amount[_ngcontent-%COMP%]{font-weight:700;white-space:nowrap;text-align:right}.adm-actions[_ngcontent-%COMP%]{white-space:nowrap;text-align:right}.adm-actions[_ngcontent-%COMP%]   .btn[_ngcontent-%COMP%] + .btn[_ngcontent-%COMP%]{margin-left:6px}.adm-note[_ngcontent-%COMP%]{max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:italic}.adm-age[_ngcontent-%COMP%]{font-size:11.5px;font-weight:600}.adm-age.fresh[_ngcontent-%COMP%]{color:var(--text-light)}.adm-age.warn[_ngcontent-%COMP%]{color:#b45309}.adm-age.late[_ngcontent-%COMP%]{color:var(--danger)}.adm-days[_ngcontent-%COMP%]{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:700;white-space:nowrap;background:var(--bg);color:var(--text-muted)}.adm-days.soon[_ngcontent-%COMP%]{background:#f59e0b26;color:#b45309}.adm-days.urgent[_ngcontent-%COMP%]{background:#ef444426;color:#b91c1c}.adm-plan[_ngcontent-%COMP%]{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700}.adm-plan.plan-free[_ngcontent-%COMP%]{background:var(--bg);color:var(--text-muted)}.adm-plan.plan-basic[_ngcontent-%COMP%]{background:#3b82f621;color:#1d4ed8}.adm-plan.plan-pro[_ngcontent-%COMP%]{background:#116cbf29;color:#0d5294}.adm-plan.plan-business[_ngcontent-%COMP%]{background:#2f2f4c1f;color:var(--accent)}.adm-empty[_ngcontent-%COMP%]{text-align:center;padding:52px 24px}.adm-empty-ico[_ngcontent-%COMP%]{width:54px;height:54px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#22c55e21;color:var(--success)}.adm-empty[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{margin:0 0 6px;font-size:15.5px}.adm-empty[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0 auto 16px;max-width:420px;font-size:13px;color:var(--text-muted)}.adm-modal[_ngcontent-%COMP%]{max-width:540px}.adm-sum[_ngcontent-%COMP%]{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 16px;margin-bottom:16px;border-radius:var(--radius-lg);background:var(--bg);border:1px solid var(--border)}.adm-sum-amount[_ngcontent-%COMP%]{font-size:20px;font-weight:800;color:var(--primary);white-space:nowrap}.adm-hint[_ngcontent-%COMP%]{margin:0 0 14px;padding:10px 12px;border-radius:9px;background:#f0f9ff;border:1px solid #bae6fd;color:#075985;font-size:12.5px;line-height:1.55}.adm-dates[_ngcontent-%COMP%]{margin:2px 0 16px;padding:11px 13px;border-radius:9px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:13px;line-height:1.5}.adm-field-row[_ngcontent-%COMP%]{display:grid;grid-template-columns:1fr 1fr;gap:12px}.adm-profile[_ngcontent-%COMP%]{display:flex;align-items:center;gap:14px;margin-bottom:18px}.adm-avatar[_ngcontent-%COMP%]{width:52px;height:52px;border-radius:14px;flex:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;font-size:20px;font-weight:800}.adm-profile[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{margin:0;font-size:17px}.adm-profile[_ngcontent-%COMP%]   .adm-sub[_ngcontent-%COMP%]{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.adm-facts[_ngcontent-%COMP%]{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}.adm-fact[_ngcontent-%COMP%]{background:var(--surface);padding:12px 14px}.adm-fact[_ngcontent-%COMP%] > span[_ngcontent-%COMP%]{display:block;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text-light)}.adm-fact[_ngcontent-%COMP%]   b[_ngcontent-%COMP%]{display:block;margin-top:3px;font-size:14px;font-weight:600}@media(max-width:1180px){.adm-kpis[_ngcontent-%COMP%]{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.adm-kpis[_ngcontent-%COMP%], .adm-field-row[_ngcontent-%COMP%]{grid-template-columns:1fr}}.adm-field-row[_ngcontent-%COMP%]   .bill-cycle[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{padding:7px 10px;font-size:12.5px}"]})}return i})();export{ke as AdminComponent};
