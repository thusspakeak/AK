//AK/Distribution/BinomialDistribution.js

//Copyright Richard Harris 2020.
//Distributed under the Boost Software License, Version 1.0.
//(See accompanying file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//Use of this code for anything other than illustrative purposes is discouraged.

"use strict";

(function() {
 function define() {
  if(ak.binomialPMF) return;

  function pmf(n, p, lnn, lnp, lnq, k) {
   if(k>=0 && k<=n && k===ak.floor(k)) return Math.exp(k*lnp + (n-k)*lnq + lnn - ak.logGamma(k+1) - ak.logGamma(n-k+1));
   return isNaN(k) ? ak.NaN : 0;
  }

  ak.binomialPMF = function() {
   var state = {n: 1, p: 0.5};
   var arg0  = arguments[0];
   var lnn, lnp, lnq, f;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   lnn = ak.logGamma(state.n+1);
   lnp = Math.log(state.p);
   lnq = Math.log(1-state.p);

   f = function(k){return pmf(state.n, state.p, lnn, lnp, lnq, k);};
   f.n = function(){return state.n;};
   f.p = function(){return state.p;};
   return Object.freeze(f);
  };

  function cf(n, p, t) {
   var z = ak.complex(1-p + p*Math.cos(t), p*Math.sin(t));
   return ak.pow(z, n);
  }

  ak.binomialCF = function() {
   var state = {n: 1, p: 0.5};
   var arg0  = arguments[0];
   var f;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   f = function(t){return cf(state.n, state.p, t);};
   f.n = function(){return state.n;};
   f.p = function(){return state.p;};
   return Object.freeze(f);
  };

  function cdf(n, p, k) {
    if(k<0)  return 0;
    if(k>=n) return 1;
    return ak.betaQ(ak.floor(k)+1, n-ak.floor(k), p);
  }

  ak.binomialCDF = function() {
   var state = {n: 1, p: 0.5};
   var arg0  = arguments[0];
   var f;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   f = function(k){return cdf(state.n, state.p, k);};
   f.n = function(){return state.n;};
   f.p = function(){return state.p;};
   return Object.freeze(f);
  };

  function invCDF(n, p, km, cm, c) {
   var k0, k1, c0, c1;

   if(isNaN(c)) return ak.NaN;
   if(c>=1)     return n;
   if(c<=0)     return 0;

   if(c<cm) {k0=0;  k1=km;}
   else     {k0=km; k1=n;}
   km = ak.floor(k0/2 + k1/2);

   while(km!==k0 && km!==k1) {
    if(ak.betaQ(km+1, n-km, p)<c) k0 = km;
    else                          k1 = km;
    km = ak.floor(k0/2 + k1/2);
   }
   return ak.betaQ(k0+1, n-k0, p)<c ? k1 : k0;
  }

  ak.binomialInvCDF = function() {
   var state = {n: 1, p: 0.5};
   var arg0  = arguments[0];
   var km, cm, f;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   km = ak.floor(state.n*state.p);
   cm = ak.betaQ(km+1, state.n-km, state.p);

   f = function(c){return invCDF(state.n, state.p, km, cm, c);};
   f.n = function(){return state.n;};
   f.p = function(){return state.p;};
   return Object.freeze(f);
  };

  function directRnd(n, p, rnd) {
   var k = 0;
   var i;
   for(i=0;i<n;++i) if(rnd()<p) ++k;
   return k;
  }

  function rejectRatio(n, p) {
   var logn = Math.log(n);
   var logq = Math.log(1-p);
   var lognum = ak.logGamma(n+1) + n*logq + n*p;

   return function(k) {
    var logden = k*logq + ak.logGamma(n-k+1) + k*logn;
    return Math.exp(lognum-logden);
   };
  }

  function rejectRnd(n, p, rnd) {
   var lambda = n*p;
   var prnd = ak.poissonRnd(lambda, rnd);
   var ratio = rejectRatio(n, p);
   var k0 = ak.floor(lambda);
   var k1 = k0+1;
   var r0 = ratio(k0);
   var r1 = ratio(k1);
   var c;
   if(r0>r1) {while(k0>0 && r0>r1) {k1=k0;r1=r0;r0=ratio(--k0);}}
   else      {while(k1<n && r0<r1) {k0=k1;r0=r1;r1=ratio(++k1);}}
   c = Math.max(r0, r1);

   return function() {
    var k;
    do {k=prnd();}
    while(k>n || c*rnd()>=ratio(k));
    return k;
   };
  }

  ak.binomialRnd = function() {
   var state = {n: 1, p: 0.5, rnd: Math.random};
   var arg0  = arguments[0];
   var km, cm, f, g;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   if(state.n<=8) {
    f = function(){return directRnd(state.n, state.p, state.rnd);};
   }
   else if(state.n<=64) {
    km = ak.floor(state.n*state.p);
    cm = ak.betaQ(km+1, state.n-km, state.p);
    f = function() {return invCDF(state.n, state.p, km, cm, state.rnd());};
   }
   else if(state.p<=0.5) {
    f = rejectRnd(state.n, state.p, state.rnd);
   }
   else {
    g = rejectRnd(state.n, 1-state.p, state.rnd);
    f = function() {return state.n-g();};
   }

   f.n = function(){return state.n;};
   f.p = function(){return state.p;};
   f.rnd = function(){return state.rnd;};
   return Object.freeze(f);
  };

  var constructors = {};

  constructors[ak.UNDEFINED_T] = function() {
  };

  constructors[ak.FUNCTION_T] = function(state, rnd) {
   state.rnd = rnd;
  };

  constructors[ak.NUMBER_T] = function(state, n, args) {
   var arg1 = args[1];
   constructors[ak.NUMBER_T][ak.nativeType(arg1)](state, arg1, args);

   state.n = Number(n);
   if(state.n<0 || state.n!==ak.floor(state.n) || !isFinite(state.n)) throw new Error('invalid n in ak.binomial distribution');
  };

  constructors[ak.NUMBER_T][ak.UNDEFINED_T] = function(state) {
  };

  constructors[ak.NUMBER_T][ak.FUNCTION_T] = function(state, rnd) {
   state.rnd = rnd;
  };

  constructors[ak.NUMBER_T][ak.NUMBER_T] = function(state, p, args) {
   var arg2 = args[2];
   constructors[ak.NUMBER_T][ak.NUMBER_T][ak.nativeType(arg2)](state, arg2, args);

   state.p = Number(p);
   if(!(state.p>0 && state.p<1)) throw new Error('invalid p in ak.binomial distribution');
  };

  constructors[ak.NUMBER_T][ak.NUMBER_T][ak.UNDEFINED_T] = function(state) {
  };

  constructors[ak.NUMBER_T][ak.NUMBER_T][ak.FUNCTION_T] = function(state, rnd) {
   state.rnd = rnd;
  };
 }

 ak.using(['Special/BetaFunction.js', 'Distribution/PoissonDistribution.js'], define);
})();
