QUnit.config.reorder = false;

function testSetup(){
    $.hr.init();
    document.location.hash = '';

    $(document).unbind('hr_0');
    $(document).unbind('hr_1');
    $(document).unbind('hr_2');
}

testSetup();


test("can initialize hashrouter", function() {
    testSetup();
    ok(true);
});

test("can change the url to specific key and value", function() {
    testSetup();
    $.hr.setUrl('page','index', true);
    equal(document.location.hash, '#!/page:index/');
    ok(true);
});

test("can change the url to an object of keys and values", function(){
    testSetup();
    $.hr.setUrl({'page':'page2', 'id':'4'}, true);
    equal(document.location.hash, '#!/page:page2/id:4/');
    ok(true);
});


test("default values return correctly", function(){
    testSetup();
    $.hr.setDefault('hats', 5);
    equal($.hr.get('hats'), 5);
});

test("default value replaced with standard", function(){
    testSetup();
    $.hr.setDefault('hats', 5);
    $.hr.set('hats', 6);
    equal($.hr.get('hats'), 6);
});

test("default value in use after standard deleted", function(){
    testSetup();
    $.hr.setDefault('hats', 5);
    $.hr.set('hats', 6);
    equal($.hr.get('hats'), 6);
    $.hr.remove('hats');
    equal($.hr.get('hats'), 5);
});

test("standard values can be overridden", function(){
    testSetup();
    $.hr.set('hats', 5);
    equal($.hr.get('hats'), 5);
    $.hr.setOverride('hats', 6);
    equal($.hr.get('hats'), 6);
});

test("override can be removed", function(){
    testSetup();
    $.hr.set('hats', 5);
    equal($.hr.get('hats'), 5);

    $.hr.setOverride('hats', 6);
    equal($.hr.get('hats'), 6);

    $.hr.removeOverride('hats');
    equal($.hr.get('hats'), 5);
});

asyncTest("called back for a value changing", function(){
    testSetup();
    $.hr.bind('a1', function(value){
        equal(value, '1');
        ok(true);
        start();
    });
    $.hr.setUrl({'a1':'1'}, true);
});

asyncTest("called back for multi values", function(){
    testSetup();
    $.hr.bind(['a2', 'a3'], function(values){
        equal(values.a2, 'aa');
        equal(values.a3, 'bb');
        ok(true);
        start();
    });
    $.hr.setUrl({'a2':'aa', 'a3':'bb'}, true);
});

asyncTest("called back for object values equal to specified value", function(){
    testSetup();
    $.hr.bind({'a4':'aa'}, function(values){
        equal(values, 'aa');
        ok(true);
        start();
    });
    $.hr.setUrl({'a4':'aa'}, true);
});

asyncTest("not called back for object values not equal to specified value", function(){
    testSetup();
    $.hr.bind({'a5':'bb'}, function(values){
        ok(false);
        start();
    });
    $.hr.setUrl({'a5':'aa'}, true);
    setTimeout(function(){
        ok(true);
        start();
    }, 1000);
});






