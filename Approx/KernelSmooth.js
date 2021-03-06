//AK/Approx/KernelSmooth.js

//Copyright Richard Harris 2020.
//Distributed under the Boost Software License, Version 1.0.
//(See accompanying file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//Use of this code for anything other than illustrative purposes is discouraged.

"use strict";

(function() {
 function define() {
  if(ak.kernelSmooth) return;

  function copyNodes(nodes) {
   var n = nodes.length;
   var copy = new Array(n);
   var i;

   for(i=0;i<n;++i) copy[i] = {x:nodes[i].x, y:nodes[i].y};
   return copy;
  }

  ak.kernelSmooth = function() {
   var state = {nodes:[], kernel:undefined};
   var arg0 = arguments[0];
   var f;

   constructors[ak.nativeType(arg0)](state, arg0, arguments);

   f = function(x) {
    var n = state.nodes.length;
    var y0 = 0;
    var y1 = 0;
    var w;

    while(n-->0) {
     w = state.kernel(x, state.nodes[n].x);
     y0 += w * state.nodes[n].y;
     y1 += w;
    }
    return y0/y1;
   };
   f.nodes = function() {return copyNodes(state.nodes);};
   f.kernel = function() {return state.kernel;};
   return Object.freeze(f);
  };

  var constructors = {};

  constructors[ak.ARRAY_T] = function(state, arg0, args) {
   var arg1 = args[1];
   constructors[ak.ARRAY_T][ak.nativeType(arg1)](state, arg0, arg1, args);
  };

  constructors[ak.ARRAY_T][ak.ARRAY_T] = function(state, arg0, arg1, args) {
   var arg2 = args[2];
   constructors[ak.ARRAY_T][ak.ARRAY_T][ak.nativeType(arg2)](state, arg0, arg1, arg2);
  };

  constructors[ak.ARRAY_T][ak.ARRAY_T][ak.FUNCTION_T] = function(state, x, y, f) {
   var n = x.length;
   var i, xi, yi;

   if(y.length!==n) throw new Error('size mismatch in ak.kernelSmooth');

   state.nodes.length = n;
   for(i=0;i<n;++i) {
    xi = x[i];
    yi = Number(y[i]);
    if(!isFinite(yi)) throw new Error('invalid node value in ak.kernelSmooth');
    state.nodes[i] = {x:xi, y:yi};
   }

   state.kernel = f;
  };

  constructors[ak.ARRAY_T][ak.FUNCTION_T] = function(state, nodes, f) {
   var n = nodes.length;
   var i, x, y;

   state.nodes.length = n;

   for(i=0;i<n;++i) {
    x = nodes[i].x; if(ak.nativeType(x)===ak.FUNCTION_T) x = x();
    y = nodes[i].y; if(ak.nativeType(y)===ak.FUNCTION_T) y = y();
    y = Number(y);
    if(!isFinite(y)) throw new Error('invalid node value in ak.kernelSmooth');
    state.nodes[i] = {x:x, y:y};
   }

   state.kernel = f;
  };
 }

 ak.using('', define);
})();